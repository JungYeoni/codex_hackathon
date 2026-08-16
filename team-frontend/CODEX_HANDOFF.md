# Codex 핸드오프: team-frontend

## 목적

`team-frontend/`는 팀원이 만든 정적 UI 시안과 향후 프론트엔드 수정본을 보관하는 작업 공간이다. 현재 서비스 앱에 연결하지 않고 디자인·문구·인터랙션 시안을 관리한다.

## 현재 파일

- `index.html`: `BuyWise` 중고 구매 판단 도우미의 단일 페이지 시안
- `styles.css`: 기본 레이아웃, 색상, 반응형 스타일
- `expert.css`: 전문가 의견 요청 영역의 추가 스타일

`index.html` 마지막에 `./app.js`를 불러오지만 현재 이 디렉터리에는 `app.js`가 없다. 따라서 파일을 브라우저에서 열면 화면은 보이더라도 버튼과 단계 전환 등 인터랙션은 동작하지 않을 수 있다.

## 반드시 지킬 범위

1. 팀원 시안 수정은 이 디렉터리 안에서만 한다.
2. 기존 서비스 화면을 바꾸려는 경우에도 먼저 이 폴더에서 시안을 완성한 뒤 별도 통합 작업으로 진행한다.
3. `app/`, `public/`, `package.json`, `vercel.json`은 시안 수정만을 이유로 변경하지 않는다.
4. API 키, 비밀번호, 개인정보, 실제 사용자 데이터는 이 폴더에 넣지 않는다.
5. 이미지나 폰트를 추가할 때는 라이선스를 확인하고, 가능하면 프로젝트 내부 정적 파일로 관리한다.

## Vercel 영향

루트의 `.vercelignore`가 `team-frontend/`를 배포 대상에서 제외한다. 또한 현재 앱 코드에서 이 폴더를 import하지 않는다. 따라서 이 폴더 안의 HTML/CSS 수정은 현재 Vercel 서비스 화면에 반영되지 않는다.

실제 서비스에 반영할 때는 이 문서와 `.vercelignore`를 먼저 확인하고, 필요한 부분만 Next.js 앱 구조에 맞게 `app/` 또는 `public/`으로 통합한다.

## 작업 방법

```bash
git pull --rebase origin main

# team-frontend 안의 파일만 수정
git add team-frontend
git commit -m "Update team frontend draft"
git pull --rebase origin main
git push origin main
```

커밋 전에는 `git status`로 `team-frontend/` 외 파일이 함께 포함되지 않았는지 확인한다. `main`에 직접 push하는 방식이므로, 다른 팀원이 동시에 작업 중이면 먼저 `git pull --rebase origin main`을 실행한다.

## Codex가 다음에 해야 할 일

팀원이 “서비스에 반영해줘”라고 요청하기 전까지는 이 폴더의 파일을 현재 앱에 연결하지 않는다. 반영 요청이 오면 다음을 확인한다.

- HTML 구조를 React/Next.js 컴포넌트로 변환할지 결정
- `app.js`가 필요한 인터랙션을 현재 앱 상태·API와 어떻게 연결할지 설계
- 외부 Google Fonts 의존성을 유지할지 검토
- 모바일 레이아웃과 접근성 확인
- `npm run build`, `npm run lint`, 관련 테스트 실행
- 통합 후 `.vercelignore`에서 필요한 항목을 제외할지 재검토

## 완료 기준

시안 단계의 완료 기준은 팀원이 `team-frontend/` 안에서 HTML/CSS를 수정하고, 저장소의 기존 Vercel 서비스에는 영향이 없는 상태다. 서비스 반영 완료는 별도의 통합 작업과 검증을 거쳐야 한다.
