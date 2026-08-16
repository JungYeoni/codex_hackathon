# `app/`

UsedCheck의 사용자 화면과 서버 라우트를 관리합니다.

## 주요 구성

- `page.tsx`: 구매 기준, 캡처 업로드, 매물 비교, Evidence 결과, 판매자 질문 화면
- `globals.css`: 전체 화면 디자인과 반응형 스타일
- `layout.tsx`: 전역 메타데이터와 HTML 레이아웃
- `api/`: 서버에서 실행되는 API 라우트
- `_sites-preview/`: 초기 Sites 프리뷰용 코드

클라이언트 컴포넌트는 사용자 입력과 화면 상태를 담당하고, API 키가 필요한 작업은 `api/` 아래 서버 코드에서 처리합니다.
