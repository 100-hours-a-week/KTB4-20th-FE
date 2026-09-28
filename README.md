# Frontend

React + TypeScript + Vite 기반 프론트엔드 프로젝트입니다.

## 기술 스택

- Node.js 24 LTS
- React 19
- TypeScript 7
- Vite 8
- CSS (CSS Modules)
- React Router
- Axios
- oxlint / Prettier

## 폴더 구조

```
src/
├── api/          # axios 인스턴스, API 호출 함수
├── assets/       # 이미지, 폰트 등 정적 리소스
├── components/   # 재사용 가능한 공통 컴포넌트
├── hooks/        # 커스텀 훅
├── pages/        # 라우트 단위 페이지 (페이지별 폴더 + .module.css)
├── routes/       # 라우트 정의
├── styles/       # 전역 스타일(variables.css, global.css)
├── utils/        # 공통 유틸 함수
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

## 시작하기

```bash
nvm use
npm ci
cp .env.example .env   # 필요한 값으로 수정
npm run dev
```

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 타입 검사 후 프로덕션 빌드 |
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | oxlint 검사 |
| `npm run format` | Prettier 포맷 적용 |

## 협업 규칙

이 프로젝트는 간단한 Git-flow 전략을 사용합니다.

| 브랜치 | 용도 |
| --- | --- |
| `main` | 배포되는 코드 (합쳐지면 자동 배포) |
| `dev` | 다음 배포를 위한 개발 코드 |
| `feat/*`, `fix/*` 등 | 기능 개발·수정 (`dev`에서 분기 → `dev`로 PR) |
| `hotfix/*` | 배포 후 긴급 수정 (`dev`에서 분기 → `dev`로 PR → `dev`에서 `main`으로 PR) |

`main`에는 예외 없이 `dev` 브랜치에서만 PR을 보낼 수 있습니다. (PR 검사에서 확인)

### 기능 개발

```bash
git switch dev
git pull origin dev
git switch -c feat/kakao-login

# 작업 후
npm run lint
npm run build
git add .
git commit -m "feat: 카카오 로그인 구현"
git push -u origin feat/kakao-login
```

기능 브랜치에서 `dev` 브랜치로 Pull Request를 만들고, 리뷰를 받은 뒤 merge합니다.

### 배포 후 긴급 수정 (hotfix)

배포된 뒤 바로 고쳐야 하는 문제도 `dev`를 거쳐 `main`으로 올립니다. `main`에는 `dev`에서만 PR을 보낼 수 있습니다.

```bash
git switch dev
git pull origin dev
git switch -c hotfix/region-api

# 작업 후
npm run typecheck
npm run lint
npm run build
git push -u origin hotfix/region-api
```

1. `hotfix/*` 브랜치에서 `dev`로 Pull Request를 만들고 merge합니다.
2. `dev`에서 `main`으로 Pull Request를 만들고 merge합니다. merge되면 자동 배포됩니다.

커밋 메시지는 변경 목적이 드러나게 작성합니다.

- `feat`: 기능 추가
- `fix`: 버그 수정
- `style`: UI 또는 스타일 수정
- `refactor`: 기능 변경 없는 코드 개선
- `docs`: 문서 수정
- `chore`: 환경 설정 및 기타 작업
