# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 명령어

```bash
npm run dev      # 개발 서버 실행 (http://localhost:3000)
npm run build    # 빌드 + 타입 체크 — 커밋 전 반드시 실행
npm run lint     # ESLint 실행
```

테스트 프레임워크 없음. 타입 에러는 `npm run build`로 확인.

**`npm run build` 실패 시 커밋하지 말 것.** 타입 에러는 런타임 전에 반드시 잡아야 한다.

## 커밋 규칙

- 형식: Conventional Commits, **영어**로 작성
- 허용 접두사만 사용: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
  - `perf:`, `ci:` 등 비표준 접두사 금지
- **`Co-Authored-By` 트레일러 절대 금지** — 커밋은 유저 이름으로만
- 커밋은 기능 단위로 분리. 하나의 커밋에 여러 기능을 묶지 말 것
  - 좋은 예: `feat: add mission submission form` / `fix: correct KST date comparison`
  - 나쁜 예: `feat: add submission form and fix dates and update styles`

## 개발 워크플로우

각 개발 단계 완료 후, **반드시 이 순서대로** 진행:

1. `npm run build` 실행 — 타입 에러 최종 확인
2. 유저에게 변경 내용 보고 (수정 파일, 주요 내용 요약)
3. 기능 단위로 커밋 (하나의 큰 커밋 X)
4. `TODO.md` 체크 완료 표시 및 갱신
5. 다음 단계 진행

다음 단계로 가기 전에 이 순서를 **반드시** 완료할 것.

## 아키텍처

**Next.js 16 App Router + Supabase + TypeScript (strict)**

### 디렉토리 구조

```
app/                    # Next.js App Router 페이지
  admin/               # 관리자 전용 페이지 (requireAdmin 가드)
  auth/callback/       # OAuth 콜백 라우트
  meetings/[id]/       # 모임 상세, 미션, 팀
  login/, signup/, my/ # 인증 흐름 페이지

lib/
  supabase/
    client.ts          # 브라우저용 Supabase 클라이언트 (createClient)
    server.ts          # 서버용 Supabase 클라이언트 (createClient, async)
    middleware.ts      # 세션 갱신 + 인증 가드 (updateSession)
  actions/             # Next.js Server Actions ('use server')
  queries/             # 서버 사이드 데이터 조회 함수
  constants/routes.ts  # 모든 라우트 경로 (ROUTES 객체)
  storage/upload.ts    # Supabase Storage 헬퍼

components/
  layouts/             # Header, Footer, HeaderActions
  features/            # 기능별 컴포넌트 (auth, meetings, admin, missions, leaderboard)
  shared/              # 공통 재사용 컴포넌트

types/
  database.ts          # Supabase 자동 생성 타입 (직접 편집 금지)
  index.ts             # database.ts에서 Row/Insert/Enum 타입 재export
```

### 인증 흐름

- **미들웨어** (`middleware.ts` → `lib/supabase/middleware.ts`): 모든 요청에 `getUser()`로 서버 사이드 세션 검증. 공개 경로: `/`, `/login`, `/auth/*`.
- **OAuth 콜백** (`/auth/callback`): 코드 교환 → `public.users` 테이블 확인 → 신규 유저는 `/signup`, 기존 유저는 `/my`로 리다이렉트.
- **페이지**: 유저 정보는 `getSession()` 사용 (미들웨어에서 이미 검증됨). 역할 변경 등 민감한 로직에서만 `getUser()` 사용.
- **관리자 가드**: `lib/queries/admin.ts`의 `requireAdmin(userId)` — admin이 아니면 `/my`로 리다이렉트.

**`getUser()` vs `getSession()` 선택 기준:**

| 상황                         | 사용할 함수                              |
| ---------------------------- | ---------------------------------------- |
| 페이지에서 유저 정보 읽기    | `getSession()`                           |
| 권한 변경, 결제 등 민감 로직 | `getUser()`                              |
| OAuth 콜백 후 유저 확인      | `exchangeCodeForSession()` 반환값 재사용 |

### 데이터 레이어 패턴

- **Server Actions** (`lib/actions/`): `'use server'` 뮤테이션, 쓰기 후 `revalidatePath()` 호출.
- **Query 함수** (`lib/queries/`): 순수 async 데이터 조회, Server Component에서 직접 호출.
- **API 라우트 없음** — 모든 데이터는 Server Actions 또는 Server Component에서 직접 Supabase 호출.

**뮤테이션은 Server Actions, 조회는 Query 함수.** 둘을 섞지 말 것.

### Supabase 주요 규칙

- `types/database.ts`의 각 테이블에 `Relationships` 필드 필수. 없으면 쿼리 타입이 `never`로 추론됨.
- `auth.users`(Supabase 내부)와 `public.users`(앱 테이블)는 별개. 유저 프로필은 항상 `public.users`에 있음.
- RLS 자기참조 정책은 `42P17` 무한 재귀 유발. `SECURITY DEFINER` 헬퍼 함수로 우회 (`002_rls.sql` 참고).
- Storage 경로: `avatars/{userId}/avatar.{ext}`, `mission-images/{meetingId}/{missionId}/{teamId}/image.{ext}` — 경로 구조가 Storage RLS에 필요.

**Supabase 자주 하는 실수:**

```typescript
// 나쁜 예 — Relationships 없이 조인하면 타입이 never로 추론됨
// types/database.ts의 해당 테이블에 Relationships 추가 필수

// 나쁜 예 — auth.users를 직접 조회하려고 시도
const { data } = await supabase.from("auth.users").select(); // 작동 안 함

// 좋은 예 — 항상 public.users 사용
const { data } = await supabase.from("users").select();
```

### 데이터베이스 스키마

```
users               — 앱 프로필 (auth.users와 1:1)
meetings            — 모임 (invite_code로 참여)
meeting_members     — 모임 ↔ 유저 (N:M)
teams               — 모임 내 조(팀)
team_members        — 조 ↔ 유저 (N:M)
missions            — 모임 내 미션 (upcoming/active/completed)
mission_submissions — 팀 사진 제출물 (pending/approved/rejected), 팀당 1회
points              — 포인트 내역; 트리거로 teams.total_points 자동 갱신
```

### 스타일링

- Tailwind CSS v4 + shadcn/ui, **Brutalist (Concrete Mono) 테마**
- 커스텀 CSS 클래스: `btn-brutal`, `card-brutal`, `input-brutal`, `noise-overlay`
- `btn-brutal`은 `bg-primary text-primary-foreground` 기본. **배경색 오버라이드 시 글자색도 반드시 함께 변경.**
- 폰트: Space Grotesk (sans), JetBrains Mono (mono)
- 토스트: Sonner (`<Toaster position="bottom-center" />` in root layout)

**새 UI 컴포넌트 추가 전:** `components/shared/`에 이미 같은 역할의 컴포넌트가 있는지 확인할 것. 중복 컴포넌트 생성 금지.

### 데이터베이스 마이그레이션

`supabase/migrations/`에 파일이 있지만 **Supabase Dashboard → SQL Editor**에서 순서대로 직접 실행해야 함:

1. `001_schema.sql` — 테이블, 인덱스, 트리거
2. `002_rls.sql` — 헬퍼 함수 + 전체 RLS 정책
3. `003_storage.sql` — 스토리지 버킷 및 정책

**Supabase CLI `db push`는 사용하지 않음** — 반드시 Dashboard에서 실행.

스키마 변경 시: SQL 파일 수정 후 유저에게 Dashboard에서 실행하도록 안내할 것. Claude가 직접 실행할 수 없음.

### 환경 변수

| 변수                                            | 설명                                  |
| ----------------------------------------------- | ------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                      | Supabase 프로젝트 URL                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                 | Supabase anon 키                      |
| `SUPABASE_SERVICE_ROLE_KEY`                     | 서버 전용 service_role 키             |
| `NEXT_PUBLIC_APP_URL`                           | 배포된 앱 URL                         |
| `NEXT_PUBLIC_SUPABASE_SUPPRESS_SESSION_WARNING` | `true`로 설정 시 getSession 경고 억제 |

## 코드 작성 원칙

- **기존 패턴 먼저 파악.** 새 기능 구현 전, 유사한 기존 기능을 먼저 읽어 패턴을 따를 것.
- **불필요한 추상화 금지.** 한 곳에서만 쓰이는 helper 함수, 과도한 컴포넌트 분리 금지.
- **요청받은 것만 수정.** 버그 수정 시 주변 코드를 리팩토링하지 말 것. 스타일 변경 시 로직에 손대지 말 것.
- **타입 안전성 유지.** `as any`, `@ts-ignore`, `as unknown as T` 패턴은 근본 원인을 해결하는 대신 타입 문제를 숨기므로 사용 금지.
- **라우트 경로는 `ROUTES` 객체 사용.** `lib/constants/routes.ts`의 `ROUTES`를 통해 경로 참조. 하드코딩된 문자열 경로 금지.
