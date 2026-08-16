import { NextResponse } from "next/server";

const schema = {
  listing_extraction: {
    title: "string|null",
    price: "number|null",
    platform: "string|null",
    seller_description: "string|null",
    extracted_text: "string|null",
    product_images: "array of {image_source,description}",
    extraction_notes: "array of string",
  },
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
  evidence: "array of {field,value,status,source,reason}",
};

function configured() {
  return Boolean(process.env.OPENAI_BASE_URL && process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL);
}

const allowedStatuses = new Set(["verified", "seller_claim", "inferred", "missing", "uncertain", "contradictory"]);

function isValidAnalysisResult(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  if (!Array.isArray(result.evidence) || result.evidence.length < 3) return false;
  return result.evidence.every((item) => {
    if (!item || typeof item !== "object") return false;
    const evidence = item as Record<string, unknown>;
    return typeof evidence.field === "string" && allowedStatuses.has(String(evidence.status));
  });
}

export async function POST(request: Request) {
  if (!configured()) {
    return NextResponse.json({
      configured: false,
      message: "RunPod 설정 전입니다. 데모 결과를 사용합니다.",
    });
  }

  try {
    const form = await request.formData();
    const category = String(form.get("category") ?? "스마트폰");
    const criteria = String(form.get("criteria") ?? "");
    const description = String(form.get("description") ?? "");
    const images = form.getAll("images").filter((value): value is File => value instanceof File).slice(0, 10);
    const imageParts = await Promise.all(images.map(async (image) => ({
      type: "image_url",
      image_url: { url: `data:${image.type};base64,${Buffer.from(await image.arrayBuffer()).toString("base64")}` },
    })));

    const prompt = `당신은 UsedCheck의 중고 매물 캡처 구조화기이자 증거 추출기입니다. ${category} 중고매물의 캡처 이미지와 판매자 설명을 분석하세요.
먼저 캡처 안에 포함된 판매글 텍스트를 OCR처럼 읽어 listing_extraction에 구조화하세요.
listing_extraction에는 상품 제목, 가격(숫자), 플랫폼명, 판매자가 작성한 본문, 캡처에서 읽은 전체 텍스트, 상품 사진으로 보이는 이미지의 설명을 넣으세요.
캡처에 판매글 텍스트와 상품 사진이 함께 있으면 둘을 분리해서 기록하세요. 읽을 수 없는 글자는 추측하지 말고 extracted_text에 가능한 부분만 넣고 extraction_notes에 '일부 텍스트 판독 불가'를 기록하세요.
사용자가 별도로 제공한 판매자 설명은 seller_description에 우선 반영하되, 캡처 OCR 결과와 다르면 둘 다 보존하고 extraction_notes에 충돌을 기록하세요.
상태값은 verified(사진/증빙에서 명확히 확인), seller_claim(판매자 설명에만 있음), inferred(AI 추정), missing(정보 없음), uncertain(사진이 불명확), contradictory(사진과 설명 충돌) 중 하나만 사용하세요.
사진만으로 배터리 성능, 수리 이력, 침수 여부, 터치/카메라 기능 정상을 확정하지 마세요. 각 결과에 image_N 또는 description 출처와 짧은 reason을 포함하세요. 정보가 없으면 null과 missing을 반환하세요.
다음 JSON 객체만 반환하세요. 스키마: ${JSON.stringify(schema)}
사용자 구매 기준: ${criteria || "(없음)"}
판매자 설명: ${description || "(없음)"}`;

    const endpoint = `${process.env.OPENAI_BASE_URL!.replace(/\/$/, "")}/chat/completions`;
    const response = await fetch(endpoint, {
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
      return NextResponse.json({ configured: true, fallback: true, message: `RunPod 분석 요청 실패 (${response.status})` });
    }

    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("No model content");
    const result = JSON.parse(content) as unknown;
    if (!isValidAnalysisResult(result)) {
      return NextResponse.json({ configured: true, fallback: true, analysis_valid: false, message: "AI 응답의 증거 항목이 부족해 분석을 보류합니다." });
    }
    return NextResponse.json({ configured: true, fallback: false, analysis_valid: true, result });
  } catch (error) {
    console.error("analysis_failed", error instanceof Error ? error.message : "unknown_error");
    return NextResponse.json({ configured: true, fallback: true, message: "분석 중 오류가 발생해 데모 결과를 유지합니다." });
  }
}
