# `app/api/analyze/`

OpenAI Vision API를 호출해 캡처 이미지와 판매자 설명을 Evidence JSON으로 변환합니다.

## 처리 순서

```text
multipart/form-data 수신
→ 이미지 base64 변환
→ 판매자 설명·이미지·스키마를 모델에 전달
→ JSON 응답 파싱
→ 클라이언트에 결과 반환
```

## 안전 규칙

- API 키는 서버 환경변수에서만 읽습니다.
- 사진만으로 배터리·수리·침수·기능 정상을 확정하지 않습니다.
- `verified`, `seller_claim`, `inferred`, `missing`, `uncertain`, `contradictory` 상태를 사용합니다.
- API 미설정·호출 실패 시 데모 fallback을 반환합니다.
