# TonariMate - 프로젝트 개요

## 📋 프로젝트 정보

**프로젝트명**: TonariMate  
**목적**: 대학 조모임 활동 통합 관리 웹 애플리케이션  
**타겟 규모**: 활동 인원 100명 내외, 동시 접속 10명 이하  
**배포 형태**: PWA (Progressive Web App)

## 🎯 핵심 기능

조모임 활동을 통한 미션 기반 포인트 획득 시스템

- 조별로 주간 미션 확인
- 조원이 미션 수행 사진 제출
- 포인트 획득 및 순위 집계
- 관리자의 모임/조/미션 관리

## 🏗️ 기술 스택

### Frontend

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **PWA**: next-pwa

### Backend

- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth 예정)
- **Cache**: Redis (필요시, 현재는 Supabase만으로 시작)

### Design System

- **테마**: Concrete Mono (1950s Structural Brutalism)
- **키워드**: Tactile Noise & Heavy Shadow
- **주 폰트**: Space Grotesk (300, 700, 900)
- **폰트 제한**: 최대 3종

## 📱 페이지 구조

### 사용자 페이지

#### 1. 랜딩 페이지 (`/`)

- 간단한 서비스 설명
- 가입된 모임 가로 리스트
- 진행한 모임 가로 리스트

#### 2. 마이 페이지 (`/my`)

- 사용자 정보 (이름, 학번)
- 가입된 모임 목록

#### 3. 모임 페이지 (`/meetings/[id]`)

- 금주의 미션
- 진행중인 미션 목록
- 종료된 미션 목록
- 소속된 조 정보

#### 4. 조 상세 페이지 (`/meetings/[id]/teams/[teamId]`)

- 조 번호 및 조원 목록
- 소속 모임 정보
- 획득 점수 및 내역

#### 5. 미션 페이지 (`/meetings/[id]/missions/[missionId]`)

**진행중 미션**

- 미션 설명
- 미션 수행 날짜
- 미션 참여 인원
- 사진 제출 폼
- 제출 버튼

**완료된 미션**

- 수행 여부
- 수행 내역 (제출한 사진)
- 획득한 점수

### 관리자 페이지

#### 6. 관리자 대시보드 (`/admin`)

- 진행중/완료 모임 목록

#### 7. 모임 생성/편집 (`/admin/meetings/new`, `/admin/meetings/[id]/edit`)

- 모임 이름
- 모임 기간 (예: 2026년 1학기)
- 모임 설정

#### 8. 모임 관리 (`/admin/meetings/[id]`)

- 초대 링크 관리 (고정 링크)
- 회원 관리
- 조 관리 (조 멤버, 조 포인트)
- 미션 관리
- 조별 미션 수행 관리

## 🗂️ 디렉토리 구조

```
tonari-mate/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # 인증 관련 라우트 그룹
│   │   ├── (user)/              # 사용자 페이지 그룹
│   │   │   ├── page.tsx         # 랜딩
│   │   │   ├── my/
│   │   │   └── meetings/
│   │   │       └── [id]/
│   │   │           ├── page.tsx
│   │   │           ├── teams/
│   │   │           └── missions/
│   │   └── (admin)/             # 관리자 페이지 그룹
│   │       └── admin/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui 컴포넌트
│   │   ├── features/            # 기능별 컴포넌트
│   │   │   ├── missions/
│   │   │   ├── teams/
│   │   │   └── meetings/
│   │   └── layouts/             # 레이아웃 컴포넌트
│   ├── lib/
│   │   ├── supabase/            # Supabase 클라이언트 및 유틸
│   │   ├── utils/               # 공통 유틸리티
│   │   └── constants/           # 상수 정의
│   ├── types/                   # TypeScript 타입 정의
│   └── styles/
│       └── globals.css
├── public/
│   ├── icons/                   # PWA 아이콘
│   └── manifest.json
└── supabase/
    ├── migrations/              # DB 마이그레이션
    └── seed.sql                 # 초기 데이터
```

## 🗄️ 데이터베이스 스키마 (개요)

### 주요 테이블

- `users` - 사용자 정보
- `meetings` - 모임
- `teams` - 조
- `team_members` - 조원 매핑
- `missions` - 미션
- `mission_submissions` - 미션 제출
- `points` - 포인트 내역

## 🎨 디자인 원칙

### 모바일 최적화

- PWA를 우선으로 개발
- 모바일 뷰포트 우선 설계
- 터치 인터랙션 최적화

### Concrete Mono 디자인

- 무채색 중심 (회색, 검정, 흰색)
- 굵고 명확한 타이포그래피
- 강한 그림자와 대비
- 미니멀하면서도 구조적인 레이아웃
- 노이즈 텍스처 활용 (미묘하게)

### 성능

- 렌더링 부담 최소화
- 이미지 최적화 (next/image)
- 코드 스플리팅
- 필요한 경우만 클라이언트 컴포넌트 사용

## 🔐 보안 및 인증

- Supabase Auth를 통한 Google OAuth
- Row Level Security (RLS) 정책 적용
- 관리자 권한 체크 미들웨어
- 환경 변수를 통한 민감 정보 관리

## 📦 배포 및 환경

### 환경 변수 (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

### 배포 플랫폼 (예정)

- Vercel (Next.js 최적화)
- Supabase (Database & Auth)

## 📝 개발 우선순위

### Phase 1: 기본 구조

- [ ] Next.js 프로젝트 초기 설정
- [ ] Supabase 연동 및 스키마 설계
- [ ] 인증 시스템 구현
- [ ] 기본 레이아웃 및 디자인 시스템

### Phase 2: 핵심 기능

- [ ] 모임/조 CRUD
- [ ] 미션 생성 및 조회
- [ ] 미션 제출 및 이미지 업로드
- [ ] 포인트 시스템

### Phase 3: 관리 기능

- [ ] 관리자 대시보드
- [ ] 초대 링크 시스템
- [ ] 미션 승인/거부

### Phase 4: 최적화 및 배포

- [ ] PWA 설정
- [ ] 성능 최적화
- [ ] 모바일 UX 개선
- [ ] 프로덕션 배포

## 🤝 개발 규칙

- **커밋 메시지**: Conventional Commits 형식 권장
- **브랜치 전략**: main (프로덕션), develop (개발), feature/\* (기능)
- **코드 리뷰**: 주요 기능 추가 시 리뷰 진행
- **테스트**: 핵심 로직에 대한 유닛 테스트 작성
