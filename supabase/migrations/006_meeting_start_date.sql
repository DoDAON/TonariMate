-- 006_meeting_start_date.sql
-- meetings 테이블에 start_date 컬럼 추가
-- 조모임의 활동 시작일 (생성일과 별도). 데일리 미션 주 기준점으로 사용.

ALTER TABLE meetings ADD COLUMN start_date DATE;
