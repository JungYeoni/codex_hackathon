<p align="center">
  <img src="./team-frontend/buywise-logo.svg" alt="BuyWise 로고" width="222" />
</p>

<p align="center"><strong>확인 가능한 매물을 고르는 중고거래 도우미</strong></p>

## 중고거래, 이제 “좋아 보이는 매물” 말고 “확인 가능한 매물”을 고르세요.

BuyWise는 중고 스마트폰 판매글의 캡처와 판매자 설명을 분석해 **확인된 정보, 판매자 주장, 추정, 정보 공백**을 나눠 보여주는 증거 기반 구매 도우미입니다.

> AI는 정보를 추출하고, 룰은 판단의 범위를 정합니다.

중고거래에서 가장 위험한 순간은 정보가 부족한데도 가격만 보고 결정하는 순간입니다. BuyWise는 매물을 대신 사거나 단정하지 않습니다. 대신 지금 확인할 수 있는 것과 반드시 물어봐야 할 것을 분리해 다음 행동까지 연결합니다.

## 한눈에 보는 흐름

```text
구매 기준 설정
    ↓
판매글 캡처 + 판매자 설명 입력
    ↓
AI 증거 추출
    ↓
확인됨 / 판매자 설명 / 추정 / 불명확 / 충돌 / 정보 없음
    ↓
비교 가능성 확인
    ↓
판매자에게 물어볼 질문 Top 3
```

## 지금 데모에서 되는 것

- 예산·용도·배터리·수리 이력 기준 확인
- 판매글 이미지 여러 장 업로드 및 미리보기
- 판매자 설명 붙여넣기
- 매물별 가격·플랫폼·판매자·사진 정보 비교
- 제품 모델, 용량, 배터리, 화면, 외관, 수리 이력 등 증거 항목 표시
- 증거 상태와 출처 표시
  - `verified` — 이미지나 증빙에서 확인됨
  - `seller_claim` — 판매자 설명에만 있음
  - `inferred` — AI 추정
  - `missing` — 정보 없음
  - `uncertain` — 사진이 불명확함
  - `contradictory` — 설명과 사진이 충돌함
- 비교 가능성 점수와 가격 비교 보류 안내
- 주요 정보 공백을 영향도 순으로 표시
- 판매자 질문 Top 3와 안전한 메시지 템플릿 제공
- 질문 메시지 클립보드 복사
- RunPod OpenAI-compatible Vision API 연결
- API 미설정·실패 시 데모 결과 fallback

## 핵심 안전장치

BuyWise는 판매자의 말을 사실로 승격하지 않습니다.

- 판매자 설명만으로 `verified`를 만들지 않습니다.
- 사진만으로 배터리 성능, 침수, 수리 이력, 기능 정상 여부를 확정하지 않습니다.
- 배터리·화면·수리 이력처럼 중요한 정보가 비어 있으면 가격 비교를 보류합니다.
- 설명과 이미지가 다르면 `contradictory`로 표시합니다.

## 현재 구현 범위

현재 버전은 해커톤 MVP 데모입니다.

### 구현됨

- BuyWise 분석 화면
- 스마트폰 매물 3개 데모 데이터
- 증거 카드와 상태 배지
- 정보 공백·비교 가능성·다음 질문 UI
- `/api/analyze`의 이미지·텍스트 분석 요청
- RunPod 설정이 없을 때의 fallback 처리
- GitHub Issue Template 및 issue-helper 워크플로

### 다음 작업

- 실제 AI 응답을 화면의 증거 카드에 연결
- 구매 기준 편집·저장
- 매물·분석 결과·판매자 답변 저장
- 실제 룰 엔진과 질문 우선순위 계산
- 비교 보관함
- 운영자 시드 큐레이션 카드 5~10개
- 엠버서더 추천 및 사용자 피드백
- 악기·노트북 등 카테고리 확장

## 제품 방향

BuyWise의 차별점은 “AI가 중고품을 대신 판정한다”가 아닙니다.

> 사용자의 구매 수고를 줄이고, 도메인 전문가의 판단을 근거와 피드백으로 축적해 다음 구매를 더 빠르고 안전하게 만드는 것.

엠버서더 추천은 “이 사용자에게 어떤 선택지가 자주 맞는가”를 설명하고, 증거 분석은 “이 매물에서 실제로 무엇이 확인되는가”를 설명합니다. 둘을 섞지 않는 것이 BuyWise의 원칙입니다.

## Tech Stack

| 영역 | 기술 |
| --- | --- |
| Product UI | React 19, TypeScript, Next App Router 호환 구조 |
| App runtime | Vinext, Vite, Nitro |
| Styling | CSS 기반 디자인 시스템, 반응형 레이아웃 |
| AI analysis | RunPod OpenAI-compatible Vision API |
| API | `app/api/analyze` Route Handler, multipart form-data |
| Data layer | Drizzle ORM, Cloudflare D1 연동 기반 |
| Deployment | Cloudflare Workers, Vercel Nitro |
| Quality | ESLint, Node.js Test Runner |
| Collaboration | GitHub Actions, reusable issue-helper workflow |

## 기술 구조

```text
React / Next App Router
        │
        ├── app/page.tsx       사용자 분석 화면
        ├── app/api/analyze    이미지·텍스트 분석 API
        ├── RunPod              OpenAI-compatible Vision API
        ├── db/                 Drizzle + Cloudflare D1 연결 기반
        └── worker/             Cloudflare Worker 진입점
```

분석 요청은 서버에서 RunPod로 전달합니다. API 키는 브라우저에 노출하지 않고 서버 환경변수에서만 읽습니다.

## 시작하기

### 요구 사항

- Node.js `22.13+`
- npm

### 설치 및 실행

```bash
npm install
npm run dev
```

### RunPod 연결

`.env.local`에 다음 값을 설정합니다.

```env
OPENAI_BASE_URL=https://api.runpod.ai/v2/<POD_ID>/openai/v1
OPENAI_API_KEY=your-runpod-api-key
OPENAI_MODEL=vision-capable-model
```

`OPENAI_BASE_URL`에는 `/chat/completions`를 넣지 않습니다. 서버가 자동으로 붙입니다.

환경변수가 없거나 API 호출에 실패해도 데모 화면은 fallback으로 동작합니다.

## 명령어

```bash
npm run dev          # 로컬 개발 서버
npm run build        # 기본 빌드
npm run build:vercel # Vercel용 빌드
npm run lint         # ESLint 검사
npm test             # 빌드 및 렌더링 테스트
```

## 프로젝트 구조

```text
app/
├── page.tsx              # BuyWise 메인 화면
├── api/analyze/route.ts  # RunPod 분석 API
├── globals.css           # 제품 UI 스타일
└── layout.tsx            # 전역 메타데이터·레이아웃
db/                       # Drizzle 연결 및 향후 스키마
worker/                   # Cloudflare Worker 진입점
public/                   # 정적 리소스
tests/                    # 빌드·렌더링 검증
MVP_PLAN.md               # 제품 방향과 단계별 계획
```

## 링크

- [MVP 계획](./MVP_PLAN.md)
- [GitHub 저장소](https://github.com/JungYeoni/codex_hackathon)
- [배포 데모](https://sardine-chi.vercel.app)

## 팀 원칙

BuyWise는 매물을 단정하는 서비스가 아니라, 사용자가 더 좋은 질문을 하고 더 안전하게 결정하도록 돕는 서비스입니다.

**확인된 것과 아직 확인되지 않은 것을 분리하는 것** — 이것이 BuyWise의 첫 번째 기능입니다.
