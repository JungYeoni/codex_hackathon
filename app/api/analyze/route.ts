import { NextResponse } from "next/server";

const schema = {
  extracted_description: "string",
  model: "string",
  storage: "string|null",
  price: "number|null",
  battery_health: "string|null",
  screen_condition: "string|null",
  rear_condition: "string|null",
  corner_condition: "string|null",
  camera_lens: "string|null",
  charging_port: "string|null",
  speaker_microphone: "string|null",
  biometrics: "string|null",
  repair_history: "string|null",
  water_damage: "string|null",
  accessories: "string|null",
  warranty: "string|null",
  listing_verification: "{status: match|mismatch|uncertain, detected_category: string|null, reason: string}",
  evidence: "array of {field,value,status,source,reason}",
};

const replySchema = {
  summary: "string",
  evidence: "array of {field,value,status,reason}",
};

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const requiredEnvironmentKeys = ["OPENAI_API_KEY", "OPENAI_MODEL"] as const;

function missingEnvironmentKeys() {
  return requiredEnvironmentKeys.filter((key) => !process.env[key]?.trim());
}

export async function POST(request: Request) {
  const missing = missingEnvironmentKeys();
  if (missing.length) {
    console.error("analysis_not_configured", { missing });
    return NextResponse.json({
      configured: false,
      fallback: true,
      missing,
      message: `분석 환경변수가 누락되었습니다: ${missing.join(", ")}`,
    });
  }

  try {
    const form = await request.formData();
    const category = String(form.get("category") ?? "스마트폰");
    const criteria = String(form.get("criteria") ?? "");
    const description = String(form.get("description") ?? "");
    const mode = String(form.get("mode") ?? "listing");
    const sellerReply = String(form.get("reply") ?? "");
    const images = form.getAll("images").filter((value): value is File => value instanceof File).slice(0, MAX_IMAGES);
    if (mode === "reply") {
      if (!sellerReply.trim()) return NextResponse.json({ message: "판매자 답변이 필요합니다." }, { status: 400 });
      const replyPrompt = `당신은 BuyWise의 판매자 답변 검증기입니다. 판매자의 답변에서 구매 판단에 영향을 주는 사실만 추출하세요.
구매 기준: ${criteria || "없음"}
답변: ${sellerReply}
각 항목의 상태는 verified(답변에 명시됨), seller_claim(판매자가 주장했지만 증빙 없음), uncertain(답변이 모호함), contradictory(기존 정보와 충돌 가능) 중 하나만 사용하세요.
배터리 성능, 수리 이력, 침수 여부, 카메라·충전·스피커·터치 기능은 답변에 명시된 경우에만 반영하고, 판매자 말만으로 객관적 사실로 확정하지 마세요.
다음 JSON 객체만 반환하세요. 스키마: ${JSON.stringify(replySchema)}`;
      const replyResponse = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL,
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: replyPrompt }],
        }),
      });
      if (!replyResponse.ok) return NextResponse.json({ configured: true, fallback: true, message: `판매자 답변 분석 실패 (${replyResponse.status})` });
      const replyPayload = await replyResponse.json() as { choices?: Array<{ message?: { content?: string } }> };
      const replyContent = replyPayload.choices?.[0]?.message?.content;
      if (!replyContent) throw new Error("No seller reply content");
      return NextResponse.json({ configured: true, fallback: false, result: JSON.parse(replyContent) });
    }
    if (!images.length && !description.trim()) {
      return NextResponse.json({ message: "판매글 설명 또는 이미지가 필요합니다." }, { status: 400 });
    }
    const invalidImage = images.find((image) => !SUPPORTED_IMAGE_TYPES.has(image.type) || image.size > MAX_IMAGE_BYTES);
    if (invalidImage) {
      return NextResponse.json({ message: "이미지는 JPG, PNG, WEBP 형식의 10MB 이하 파일만 지원합니다." }, { status: 400 });
    }
    const imageParts = await Promise.all(images.map(async (image) => ({
      type: "image_url",
      image_url: { url: `data:${image.type};base64,${Buffer.from(await image.arrayBuffer()).toString("base64")}` },
    })));

    const prompt = `당신은 BuyWise의 증거 추출기입니다. 먼저 업로드된 사진이 선택된 '${category}' 중고매물의 상위 상품군과 같은지 검증하세요.
listing_verification은 오직 상위 상품군으로만 판단합니다. 예를 들어 스마트폰 카테고리에서는 아이폰 12, 아이폰 14, 갤럭시 모두 반드시 match입니다. 사진 속 모델·용량·색상이 판매자 설명과 달라도 mismatch로 처리하지 말고, 해당 evidence만 contradictory 또는 uncertain으로 기록하세요.
사진에 선택 카테고리와 명확히 다른 상품(예: 스마트폰 분석에 헤어 제품 사진)이 보일 때만 listing_verification.status를 mismatch로 반환하세요. 이 경우 나머지 분석 항목은 추측하지 말고 null 또는 missing으로 반환하세요.
사진이 없거나 사진만으로 상품 종류를 판별하기 어려우면 uncertain, 사진과 카테고리가 일치하면 match를 반환하세요. detected_category에는 사진에서 식별한 상품 종류를 한국어로 짧게 적으세요.
그 다음 ${category} 중고매물의 사진과 판매자 설명에서 확인 가능한 후보를 구조화하세요.
상태값은 verified(사진/증빙에서 명확히 확인), seller_claim(판매자 설명에만 있음), inferred(AI 추정), missing(정보 없음), uncertain(사진이 불명확), contradictory(사진과 설명 충돌) 중 하나만 사용하세요.
사진만으로 배터리 성능, 수리 이력, 침수 여부, 터치/카메라 기능 정상을 확정하지 마세요. 각 결과에 image_N 또는 description 출처와 짧은 reason을 포함하세요. 정보가 없으면 null과 missing을 반환하세요.
사진 속 판매글에 보이는 제목, 가격, 상품 설명, 상태, 구성품, 거래 조건 등의 텍스트를 읽어 extracted_description에 자연스러운 한국어 문장으로 정리하세요. 판매자 설명 입력이 비어 있어도 사진에서 읽은 텍스트만으로 작성하고, 사진에서 판매글 문구를 읽을 수 없으면 빈 문자열을 반환하세요. 이미지에 없는 내용을 추측해서 추가하지 마세요.
다음 JSON 객체만 반환하세요. 스키마: ${JSON.stringify(schema)}
사용자 구매 기준: ${criteria || "(없음)"}
판매자 설명: ${description || "(없음)"}`;

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: [{ type: "text", text: prompt }, ...imageParts] }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ configured: true, fallback: true, message: `OpenAI 분석 요청 실패 (${response.status})` });
    }

    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("No model content");
    const result: unknown = JSON.parse(content);
    if (!result || typeof result !== "object" || Array.isArray(result)) {
      throw new Error("Invalid model response");
    }
    const verification = (result as { listing_verification?: { status?: unknown; detected_category?: unknown; reason?: unknown } }).listing_verification;
    const hasVerificationStatus = verification?.status === "match" || verification?.status === "mismatch" || verification?.status === "uncertain";
    if (images.length && !hasVerificationStatus) {
      return NextResponse.json({
        configured: true,
        fallback: false,
        invalidListing: true,
        message: "사진과 선택 카테고리의 일치 여부를 확인하지 못했습니다. 사진을 다시 올려주세요.",
      });
    }
    if (images.length && verification?.status === "mismatch") {
      const detectedCategory = typeof verification.detected_category === "string" && verification.detected_category.trim()
        ? `사진에서는 '${verification.detected_category.trim()}'(으)로 보입니다. `
        : "";
      const reason = typeof verification.reason === "string" && verification.reason.trim()
        ? verification.reason.trim()
        : "선택한 카테고리와 다른 상품이 사진에서 확인됐습니다.";
      return NextResponse.json({
        configured: true,
        fallback: false,
        invalidListing: true,
        message: `${detectedCategory}${reason} '${category}' 매물로는 분석할 수 없습니다.`,
        verification,
      });
    }
    return NextResponse.json({ configured: true, fallback: false, result });
  } catch (error) {
    console.error("analysis_failed", error instanceof Error ? error.message : "unknown_error");
    return NextResponse.json({ configured: true, fallback: true, message: "분석 중 오류가 발생해 데모 결과를 유지합니다." });
  }
}
