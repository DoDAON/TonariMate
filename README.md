# TonariMate

**대학 조모임 활동 통합 관리 플랫폼**

조모임 단위로 미션을 수행하고, 사진을 제출하고, 포인트로 경쟁하는 웹 기반 서비스입니다.
PWA를 지원해 스마트폰 홈 화면에 설치하여 앱처럼 사용할 수 있습니다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript (strict) |
| Database / Auth | Supabase (PostgreSQL + Google OAuth) |
| Storage | Supabase Storage |
| Styling | Tailwind CSS v4 + shadcn/ui (Brutalist 테마) |
| 알림 | Sonner |
| 배포 | Vercel |

---

## 주요 기능

- **Google OAuth 인증** — 소셜 로그인, 신규/기존 유저 자동 분기
- **모임(Meeting)** — 초대 코드로 참여, 모임 상세 및 목록 조회
- **조(Team)** — 팀 배정, 팀원 목록, 포인트 히스토리
- **미션(Mission)** — 활성/예정/완료 상태별 목록, 사진 업로드 제출, 중복 제출 방지
- **리더보드** — 모임 내 조 포인트 순위, 내 조 하이라이트
- **관리자 대시보드** — 모임·미션·팀·제출물·유저 통합 관리
- **프로필 사진** — 정사각형 크롭 모달 (팬·줌 지원), Supabase Storage 저장
- **PWA** — 홈 화면 설치, 앱 아이콘 지원

---

## 라우트 구조

```
/                                           랜딩 (내 모임 목록)
/login                                      로그인
/signup                                     프로필 완성 (신규 가입)
/my                                         마이페이지 (프로필 수정, 모임 참여)
/meetings/[id]                              모임 상세 (미션 목록, 리더보드)
/meetings/[id]/missions/[missionId]         미션 상세 및 사진 제출
/meetings/[id]/teams/[teamId]               조 상세 (포인트 히스토리)
/admin                                      관리자 대시보드
/admin/meetings/[id]                        모임 관리
/admin/meetings/[id]/missions               미션 관리
/admin/meetings/[id]/teams                  팀 관리
/admin/users                                유저 관리
```

---

## 로컬 개발 환경 설정

### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd tonari_mate
npm install
```

### 2. 환경 변수 설정

환경 변수는 **Vercel 대시보드 → Settings → Environment Variables** 에서 관리합니다.

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 키 (서버 전용, 노출 금지) |
| `NEXT_PUBLIC_APP_URL` | 배포된 앱 URL (예: `https://your-app.vercel.app`) |
| `NEXT_PUBLIC_SUPABASE_SUPPRESS_SESSION_WARNING` | `true` 고정 (getSession 경고 억제) |

> Supabase URL과 키는 **Supabase Dashboard → Settings → API** 에서 확인할 수 있습니다.

로컬 개발 시에는 프로젝트 루트에 `.env.local` 파일을 생성하고 동일한 값을 입력합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_SUPPRESS_SESSION_WARNING=true
```

### 3. Supabase 프로젝트 설정

#### 3-1. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/) → OAuth 2.0 클라이언트 생성
2. 승인된 리디렉션 URI 추가:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
3. Supabase Dashboard → **Authentication → Providers → Google** 에서 Client ID / Secret 입력

#### 3-2. 데이터베이스 마이그레이션

`supabase/migrations/` 폴더 내 SQL 파일을 **Supabase Dashboard → SQL Editor** 에서 순서대로 실행합니다.

```
001_schema.sql     -- 테이블 스키마, 인덱스, 트리거
002_rls.sql        -- 헬퍼 함수 + 전체 RLS 정책
003_storage.sql    -- 스토리지 버킷 및 정책
```

> **주의**: `supabase/migrations/` 파일은 로컬에만 존재합니다. Supabase CLI `db push`가 아닌 Dashboard SQL Editor에서 직접 실행해야 반영됩니다.

#### 3-3. Storage 버킷 확인

SQL 실행 후 **Supabase Dashboard → Storage** 에서 두 버킷이 생성되었는지 확인합니다.

| 버킷 이름 | 공개 여부 | 용도 |
|-----------|-----------|------|
| `mission-images` | Public | 미션 제출 사진 |
| `avatars` | Public | 프로필 사진 |

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

---

## 데이터베이스 스키마

```
users               -- 앱 프로필 (auth.users와 1:1 연결)
meetings            -- 모임 (초대 코드 포함)
meeting_members     -- 모임 ↔ 유저 (N:M)
teams               -- 조 (모임 내)
team_members        -- 조 ↔ 유저 (N:M)
missions            -- 미션 (모임 내, upcoming/active/completed)
mission_submissions -- 미션 제출 (팀당 1회, pending/approved/rejected)
points              -- 포인트 내역 (teams.total_points 자동 갱신 트리거)
```

---

## 빌드 및 배포

```bash
# 빌드 검증 (타입 에러 확인)
npm run build

# Vercel 배포
vercel --prod
```

환경 변수는 Vercel 대시보드에서 관리합니다. 위의 **환경 변수 설정** 섹션을 참고하세요.

---

## 관리자 계정 설정

1. 앱에 Google 로그인 후 프로필을 완성합니다.
2. **Supabase Dashboard → Table Editor → users** 에서 해당 유저의 `role` 컬럼을 `admin`으로 변경합니다.
3. `/admin` 경로에 접근 가능해집니다.
