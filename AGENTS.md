# AGENTS.md

이 규칙은 저장소 전체에 적용한다.

## 작업 전 확인

- 프론트엔드를 생성하거나 수정하기 전에 저장소 루트의 `DESIGN.md`를 읽고 따른다.
- 기존 구조와 공통 컴포넌트를 먼저 확인하고 같은 기능을 중복해서 만들지 않는다.
- 요구사항이나 백엔드 API 규격이 확정되지 않은 경우 임의의 인증 방식이나 응답 형식을 코드에 고정하지 않는다.

## 기술 스택

- React 19, TypeScript, Vite를 사용한다.
- 소스 코드는 `.ts` 또는 `.tsx`로 작성한다. `.js`와 `.jsx` 파일을 새로 만들지 않는다.
- 라우팅은 React Router, REST API 통신은 Axios, 스타일은 CSS Modules를 사용한다.
- 새로운 패키지는 기존 도구로 해결할 수 없는 경우에만 추가한다.

## 코드 작성

- TypeScript의 `strict` 설정을 유지하고 불필요한 `any`를 사용하지 않는다.
- 컴포넌트는 PascalCase, 변수와 함수는 camelCase를 사용한다.
- 페이지는 `src/pages`, 공통 컴포넌트는 `src/components`, API 코드는 `src/api`에 둔다.
- API 요청은 `src/api/client.ts`의 `apiClient`를 사용한다.
- API 주소를 코드에 직접 작성하지 않고 `VITE_API_BASE_URL` 환경변수를 사용한다.
- 비밀키와 실제 환경변수 파일을 커밋하지 않는다. 브라우저에 노출되는 `VITE_` 변수에는 비밀값을 넣지 않는다.
- 인증 방식이 확정되기 전에는 토큰을 `localStorage`에 저장하거나 쿠키 인증을 가정하지 않는다.

## UI 작성

- 색상, 간격, 글꼴 크기는 `src/styles/variables.css`의 디자인 토큰을 사용한다.
- 로딩, 빈 상태, 오류 상태와 모바일 화면을 함께 고려한다.
- 시맨틱 HTML을 사용하고 키보드 접근과 포커스 표시를 유지한다.
- 새로운 디자인 규칙을 도입하면 `DESIGN.md`와 디자인 토큰을 함께 갱신한다.

## 완료 전 확인

다음 명령이 모두 성공하는지 확인한다.

```bash
npm run typecheck
npm run lint
npm run build
```
