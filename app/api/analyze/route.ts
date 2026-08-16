import { NextResponse } from "next/server";

const schema = {
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
    const images = form.getAll("images").filter((value): value is File => value instanceof File).slice(0, MAX_IMAGES);
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

    const prompt = `당신은 UsedCheck의 증거 추출기입니다. ${category} 중고매물의 사진과 판매자 설명에서 확인 가능한 후보를 구조화하세요.
상태값은 verified(사진/증빙에서 명확히 확인), seller_claim(판매자 설명에만 있음), inferred(AI 추정), missing(정보 없음), uncertain(사진이 불명확), contradictory(사진과 설명 충돌) 중 하나만 사용하세요.
사진만으로 배터리 성능, 수리 이력, 침수 여부, 터치/카메라 기능 정상을 확정하지 마세요. 각 결과에 image_N 또는 description 출처와 짧은 reason을 포함하세요. 정보가 없으면 null과 missing을 반환하세요.
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
    return NextResponse.json({ configured: true, fallback: false, result });
  } catch (error) {
    console.error("analysis_failed", error instanceof Error ? error.message : "unknown_error");
    return NextResponse.json({ configured: true, fallback: true, message: "분석 중 오류가 발생해 데모 결과를 유지합니다." });
  }
}
