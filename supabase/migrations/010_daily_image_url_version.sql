-- 010_daily_image_url_version.sql
-- 기존 daily_submissions 레코드의 image_url에 ?v= 파라미터 추가
-- Next.js Image 캐시가 무효화되어 최신 이미지를 표시하도록 함

UPDATE daily_submissions
SET image_url = image_url || '?v=' || extract(epoch from now())::bigint
WHERE image_url NOT LIKE '%?v=%';
