-- Step 1: 조+날짜 중복 데이터 정리
-- 같은 조에서 같은 날짜에 제출한 여러 건 중 1건만 남김
-- 우선순위: approved > pending > rejected, 동순위면 최신(created_at DESC) 유지
DELETE FROM daily_submissions
WHERE id NOT IN (
  SELECT DISTINCT ON (meeting_id, team_id, submitted_date) id
  FROM daily_submissions
  ORDER BY
    meeting_id,
    team_id,
    submitted_date,
    CASE status
      WHEN 'approved' THEN 0
      WHEN 'pending'  THEN 1
      ELSE                 2
    END,
    created_at DESC
);

-- Step 2: 기존 유저 단위 UNIQUE 제약 조건 제거
ALTER TABLE daily_submissions
  DROP CONSTRAINT IF EXISTS daily_submissions_meeting_id_submitted_by_submitted_date_key;

-- Step 3: 조(팀) 단위 UNIQUE 제약 조건 추가: 같은 조는 하루에 1건만 제출 가능
ALTER TABLE daily_submissions
  ADD CONSTRAINT daily_submissions_team_date_unique
  UNIQUE (meeting_id, team_id, submitted_date);
