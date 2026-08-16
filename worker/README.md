# `worker/`

Cloudflare Workers 배포용 진입점입니다.

- vinext 요청 처리
- Cloudflare Images 최적화 라우트
- D1·R2 바인딩 연결 지점

Vercel 배포에서는 `worker/` 대신 `vite.config.ts`의 Nitro Vercel 어댑터가 서버 실행을 담당합니다.
