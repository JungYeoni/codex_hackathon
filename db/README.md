# `db/`

Drizzle ORM 기반 데이터 계층입니다.

- `index.ts`: 데이터베이스 연결과 클라이언트 생성
- `schema.ts`: 테이블과 컬럼 정의

향후 저장 대상은 구매 기준, 매물, Evidence, 판매자 답변, 전문가 답변, 크레딧·피드백입니다.

스키마 변경 후에는 루트에서 `npm run db:generate`를 실행합니다.
