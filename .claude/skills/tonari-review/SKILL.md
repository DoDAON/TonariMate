---
name: tonari-review
description: TonariMate 프로젝트 전체 코드베이스 아키텍처 리뷰. diff 무관하게 현재 코드 전체를 읽고 누적된 패턴 위반, 구조적 문제, 기술 부채를 리포트한다. 수정은 하지 않는다.
---

# TonariMate Code Review

TonariMate 프로젝트(Next.js 16 App Router + Supabase + TypeScript strict) 전용 아키텍처 리뷰 스킬.

**이 스킬은 리포트만 한다. 코드를 직접 수정하지 않는다.**
**git diff 기반이 아니라 현재 코드베이스 전체를 기준으로 검토한다.**

## 실행 절차

1. 아래 핵심 디렉토리 전체 읽기
   - `lib/actions/` — Server Actions
   - `lib/queries/` — Query 함수
   - `lib/constants/` — 상수
   - `components/features/` — 기능 컴포넌트
   - `components/shared/` — 공통 컴포넌트
   - `app/` — 페이지 (대표 파일 샘플링)
2. 아래 기준으로 심각도별 분류하여 리포트 작성
3. 각 항목에 파일:줄번호 명시

## 리포트 형식

```
## 아키텍처 리뷰 결과

### 🔴 버그 / 보안
- [파일:줄번호] 문제 설명 → 제안

### 🟡 구조적 문제 / 패턴 위반
- [파일:줄번호] 문제 설명 → 제안

### 🟢 개선 제안 (선택)
- [파일:줄번호] 설명

### ✅ 잘 유지되고 있는 것
- 언급할 만한 것

---
총평: 한 줄 요약
```

심각도 섹션이 없으면 생략.

## 리뷰 기준

### 🔴 버그 / 보안

**인증**
- 페이지에서 인증 없이 민감 데이터 노출
- Server Action에서 현재 유저 검증 없이 다른 유저 데이터 변경 가능
- 관리자 Action에 `requireAdmin()` 누락

**Supabase**
- `createClient()` await 누락 (server.ts는 async)
- 클라이언트 컴포넌트에서 `lib/supabase/server` import
- `as any` / `@ts-ignore`로 런타임 타입 오류 가능성 숨김

**데이터 무결성**
- 트랜잭션 없이 여러 테이블 연속 쓰기 (부분 실패 시 불일치)
- 사용자 입력값 서버에서 재검증 없이 DB 저장

### 🟡 구조적 문제 / 패턴 위반

**데이터 레이어 분리**
- Query 함수(`lib/queries/`)에 `revalidatePath` 호출
- Server Action(`lib/actions/`)에 조회 로직 혼재
- 같은 쿼리 로직이 여러 Action/페이지에 중복

**라우트**
- 하드코딩된 경로 문자열 (`'/meetings/...'` 등)
- `ROUTES`에 등록되지 않은 경로

**인증 패턴**
- 페이지에서 `getUser()` 호출 (페이지는 `getSession()` 사용)
- 민감 로직에서 `getSession()` 사용 (권한 변경 등은 `getUser()` 필요)

**컴포넌트 구조**
- `components/shared/`에 이미 있는 컴포넌트 중복
- 한 곳에서만 쓰이는 컴포넌트가 shared로 분리됨 (과도한 추상화)
- 같은 상수/타입이 여러 파일에 중복 정의됨

**코드 구조**
- 한 곳에서만 쓰이는 helper 함수가 별도 파일로 분리됨
- 독립 쿼리가 순차 실행됨 (Promise.all로 병렬화 가능)
- Relationships 누락으로 조인 결과가 `never` 타입

### 🟢 개선 제안

- 반환 타입 명시 누락 (Server Action)
- 타입 추론 가능한데 중복 타입 선언
- DB 타입 enum이 있는데 문자열 리터럴 유니온으로 재정의한 경우

## 리뷰하지 않는 것

- `types/database.ts` — 자동 생성 파일
- 동작은 맞는데 스타일 차이인 코드
- 주석/문서 부재 (이 프로젝트는 주석 최소화 원칙)
- 커밋 히스토리, 브랜치 전략
