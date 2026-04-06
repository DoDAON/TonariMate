---
name: tonari-refactor
description: TonariMate 프로젝트 코드 리팩토링. 변경된 파일을 분석해 프로젝트 패턴과 CLAUDE.md 규칙 기준으로 개선점을 찾고 적용한다.
---

# TonariMate Refactor

TonariMate 프로젝트(Next.js 16 App Router + Supabase + TypeScript strict) 전용 리팩토링 스킬.

## 실행 절차

1. `git diff HEAD` 로 변경된 파일 목록 파악
2. 변경된 파일들을 읽고 아래 체크리스트 기준으로 분석
3. 문제가 있으면 수정 — **요청받지 않은 기능 추가나 리팩토링 범위 확대 금지**
4. 수정 후 `npm run build` 로 타입 에러 확인

## 체크리스트

### 데이터 레이어 분리
- [ ] Server Action(`lib/actions/`)에 조회 로직이 섞여 있지 않은가?
  - Action은 쓰기 전용. 읽기는 `lib/queries/`에 분리
- [ ] Query 함수(`lib/queries/`)에 `revalidatePath` 호출이 없는가?
  - revalidatePath는 Action에서만
- [ ] Server Component에서 직접 Supabase 클라이언트로 단순 조회하는 경우, query 함수로 분리할 만큼 재사용되는가?
  - 한 곳에서만 쓰이면 분리 불필요 — 과도한 추상화 금지

### 라우트 경로
- [ ] 하드코딩된 경로 문자열(`'/meetings/...'` 등)이 없는가?
  - 모든 경로는 `ROUTES` 객체(`lib/constants/routes.ts`) 사용
- [ ] 새 경로가 추가됐다면 `ROUTES`에도 등록됐는가?

### Supabase 패턴
- [ ] 조인 쿼리가 있는 테이블에 `Relationships` 필드가 `types/database.ts`에 있는가?
  - 없으면 조인 결과 타입이 `never`로 추론됨
- [ ] `auth.users` 직접 조회가 없는가? (`public.users` 사용)
- [ ] Server Action에서 `createClient()`는 `await`하고 있는가? (server.ts는 async)
- [ ] 클라이언트 컴포넌트에서 `lib/supabase/server`를 import하지 않는가?

### 인증 패턴
- [ ] 페이지에서 유저 정보를 읽을 때 `getSession()`을 사용하는가?
  - 권한 변경·결제 등 민감한 로직에서만 `getUser()` 사용
- [ ] 미들웨어에서 이미 검증되므로 페이지에서 중복 검증하지 않는가?
- [ ] 관리자 페이지에 `requireAdmin()` 가드가 있는가?

### 타입 안전성
- [ ] `as any`, `@ts-ignore`, `as unknown as T` 패턴이 없는가?
  - Supabase 조인 결과 타입 문제는 `Relationships` 추가로 근본 해결
- [ ] TypeScript strict 모드 위반이 없는가? (`npm run build`로 확인)

### 스타일 / UI
- [ ] `btn-brutal` 배경색을 오버라이드할 때 글자색(`text-*`)도 함께 지정했는가?
  - 기본: `bg-primary text-primary-foreground`. 배경만 바꾸면 글자 안 보임
- [ ] `components/shared/`에 이미 같은 역할의 컴포넌트가 있는데 새로 만들지 않았는가?
- [ ] 새 공통 컴포넌트가 정말 2곳 이상 쓰이는가? (1곳만이면 인라인 유지)

### 코드 품질
- [ ] 한 곳에서만 쓰이는 helper 함수가 별도 파일로 분리되지 않았는가?
- [ ] `Promise.all`로 병렬화할 수 있는 독립 쿼리가 순차 실행되지 않는가?
- [ ] Server Action의 반환 타입이 명시적으로 선언됐는가? (`Promise<{ success: boolean; error?: string }>` 등)

## 수정하지 않는 것

- 요청 범위 밖의 파일
- 동작은 맞지만 스타일이 다른 코드 (취향 차이)
- 주석, docstring 추가 (요청 없으면 금지)
- 에러 처리 없이 잘 작동하는 경로에 방어 코드 추가
