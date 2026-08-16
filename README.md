# UsedCheck

중고 거래 게시글의 캡처와 판매자 설명을 분석해, 사용자의 구매 기준에 맞는 매물 검증·정보 공백·판매자 질문을 제공하는 구매 의사결정 도우미입니다.

핵심 원칙은 다음과 같습니다.

> AI는 증거를 추출하고, 룰베이스는 판단 범위와 다음 행동을 통제합니다.

현재 데모는 스마트폰에 집중하며, RunPod의 OpenAI-compatible API를 연결할 수 있습니다. API가 설정되지 않았거나 호출에 실패하면 데모 분석 결과로 fallback합니다.

## 디렉토리 구조

```text
.
├── app/                  # 제품 화면과 서버 API
│   ├── api/analyze/      # RunPod 이미지·텍스트 분석 API
│   ├── _sites-preview/   # Sites 초기 프리뷰 전용 코드
│   ├── page.tsx          # UsedCheck 메인 사용자 화면
│   ├── globals.css       # 전체 디자인 시스템·반응형 스타일
│   ├── layout.tsx        # 전역 레이아웃·메타데이터
│   └── chatgpt-auth.ts   # 선택적 ChatGPT 로그인 헬퍼
├── build/                # Sites/Vite 빌드 플러그인
├── db/                   # Drizzle 데이터베이스 연결·스키마
├── drizzle/              # 생성된 Drizzle 마이그레이션 메타데이터
├── examples/d1/          # Cloudflare D1 사용 예제
├── public/               # favicon·정적 파일
├── tests/                # 렌더링·빌드 검증 테스트
├── worker/               # Cloudflare Worker 진입점
├── .openai/              # Sites 호스팅 바인딩 설정
├── .env.example          # RunPod 환경변수 템플릿
├── vite.config.ts        # 로컬 Cloudflare·Vercel 빌드 분기
├── vercel.json           # Vercel Nitro 빌드·출력 설정
├── package.json          # 스크립트·의존성
├── MVP_PLAN.md           # MVP·전문가 플랫폼 제품 계획
└── next.config.ts        # vinext/Next 호환 설정
```

## 디렉토리별 역할

### `app/`

UsedCheck의 실제 제품 코드입니다. 화면, 사용자 인터랙션, 서버 API를 App Router 구조로 관리합니다.

#### `app/page.tsx`

메인 분석 화면을 담당합니다.

- 구매 기준 카드와 잠금 상태
- 캡처 이미지 업로드
- 판매자 설명 입력
- 매물 A/B/C 비교 탭
- Evidence 상태 배지와 근거 출처
- 비교 가능성 점수
- 주요 정보 공백
- 판매자 질문 Top 3
- RunPod AI 분석 호출
- API 실패 시 데모 fallback 안내

현재 화면의 매물 데이터는 데모용으로 컴포넌트 내부에 있으며, 실제 서비스에서는 데이터베이스·분석 API 결과로 교체해야 합니다.

#### `app/api/analyze/route.ts`

RunPod OpenAI-compatible `/chat/completions` 엔드포인트를 호출하는 서버 API입니다.

처리 흐름:

```text
multipart/form-data 수신
→ 이미지 base64 변환
→ 판매자 설명 + 이미지 + Evidence Schema 전달
→ 구조화 JSON 응답 수신
→ 클라이언트에 결과 반환
```

보안상 API 키는 브라우저로 전달하지 않고 서버 환경변수에서만 읽습니다.

#### `app/globals.css`

UsedCheck의 전체 시각 스타일을 관리합니다.

- 색상 토큰
- 사이드바·카드·탭·배지
- Evidence 상태별 색상
- 점수 링·진행바
- 업로드 영역
- 모바일 반응형 레이아웃

#### `app/layout.tsx`

전역 HTML 언어, 사이트 제목, 설명, favicon을 설정합니다.

#### `app/chatgpt-auth.ts`

필요할 때 선택적 ChatGPT 로그인을 사용할 수 있는 헬퍼입니다. 현재 핵심 분석 흐름은 익명 사용도 가능하도록 구성되어 있습니다.

### `build/`

Sites와 Vite가 빌드될 때 필요한 플러그인 코드를 둡니다.

- `sites-vite-plugin.ts`: Sites 빌드 산출물과 호스팅 메타데이터 연결

### `db/`

Drizzle ORM 기반 데이터 계층입니다.

- `index.ts`: 데이터베이스 연결
- `schema.ts`: 애플리케이션 테이블 스키마

향후 저장 대상:

- 사용자 구매 기준
- 매물·이미지 메타데이터
- Evidence 결과
- 판매자 답변
- 전문가 질문·답변
- 전문가 크레딧·피드백

### `drizzle/`

Drizzle이 생성하는 마이그레이션 메타데이터 디렉토리입니다. 스키마를 실제로 추가하거나 변경할 때 마이그레이션 상태를 함께 관리합니다.

### `examples/d1/`

Cloudflare D1을 사용하는 예제 코드입니다. 현재 UsedCheck 핵심 기능과 분리된 참고용 surface이며, 실제 영속 저장 기능을 추가할 때 구조를 참고합니다.

### `public/`

브라우저에서 직접 제공되는 정적 파일입니다.

- `favicon.svg`: 사이트 아이콘
- `file.svg`, `globe.svg`, `window.svg`: starter에서 제공된 정적 아이콘

### `tests/`

빌드 및 렌더링 검증을 둡니다.

- `rendered-html.test.mjs`: 빌드된 앱이 렌더링 가능한지 확인

### `worker/`

Cloudflare Workers 배포용 진입점입니다. 이미지 최적화와 vinext 요청 처리를 연결합니다. Vercel 배포에서는 Nitro 어댑터가 이 역할을 대신합니다.

### `.openai/`

Sites 호스팅 관련 설정입니다.

- `hosting.json`: D1·R2 논리 바인딩 선언

실제 비밀값은 이 디렉토리나 Git에 저장하지 않습니다.

## 빌드·배포 설정 파일

### `vite.config.ts`

실행 환경에 따라 빌드 플러그인을 분기합니다.

- 로컬·Cloudflare: `vinext + Sites + Cloudflare Vite plugin`
- Vercel: `vinext + Nitro Vercel preset`

### `vercel.json`

Vercel이 일반 정적 Vite 앱으로 배포하지 않고 SSR·API를 포함한 Nitro 산출물을 사용하도록 지정합니다.

- 빌드 명령: `npm run build:vercel`
- 출력 디렉토리: `.output/public`

### `package.json`

주요 명령:

```bash
npm run dev          # 로컬 개발 서버
npm run build        # 기본 vinext 빌드
npm run build:vercel # Vercel Nitro 빌드
npm run lint         # ESLint 검사
npm test             # 빌드 및 렌더링 테스트
```

## 환경변수

`.env.example`을 복사해 `.env.local`을 만든 뒤 RunPod 정보를 입력합니다.

```bash
cp .env.example .env.local
```

```env
OPENAI_BASE_URL=https://api.runpod.ai/v2/<POD_ID>/openai/v1
OPENAI_API_KEY=your-runpod-api-key
OPENAI_MODEL=vision-capable-model
```

`OPENAI_BASE_URL`에는 `/chat/completions`를 포함하지 않습니다. 서버 코드가 뒤에 자동으로 붙입니다.

Vercel에서는 Project Settings → Environment Variables에 같은 값을 Production·Preview 환경으로 등록하고 Redeploy해야 합니다.

## 분석 데이터 흐름

```text
사용자 구매 기준
    ↓
캡처·판매자 설명
    ↓
app/api/analyze
    ↓
RunPod Vision Model
    ↓
Evidence JSON
    ↓
룰베이스 검증·정보 공백·질문 우선순위
    ↓
비교 가능성·구매 행동·판매자 질문
```

AI가 반환하는 상태는 다음과 같이 사용합니다.

- `verified`: 사진·증빙에서 확인됨
- `seller_claim`: 판매자 설명에만 있음
- `inferred`: AI 추정
- `missing`: 정보 없음
- `uncertain`: 사진이 불명확함
- `contradictory`: 정보 간 충돌

`seller_claim`을 `verified`로 자동 승격하지 않고, 핵심 정보가 부족하면 가격 비교를 보류하는 것이 서비스의 주요 안전장치입니다.

## 제품 계획

[MVP_PLAN.md](./MVP_PLAN.md)에 다음 내용을 정리해 두었습니다.

- 스마트폰 증거 기반 분석 MVP
- 카테고리별 체크리스트
- 판매자 답변 반영
- 전문가 호출·매칭·추천
- 전문가 크레딧·품질 관리
- 악기·노트북 등 카테고리 확장

## 현재 배포

- Vercel: https://sardine-chi.vercel.app
- GitHub: https://github.com/JungYeoni/codex_hackathon

RunPod 환경변수가 없는 경우에도 데모 화면은 동작하며, 실제 AI 분석 버튼은 fallback 안내를 표시합니다.
