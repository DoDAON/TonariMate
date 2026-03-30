const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;

/**
 * Canvas API를 이용해 이미지를 압축합니다.
 * - HEIC/HEIF 파일은 먼저 JPEG로 변환
 * - 최대 1920px로 리사이즈 (비율 유지)
 * - JPEG quality 0.85로 인코딩
 * - 원본이 이미 작다면 그대로 반환
 */
export async function compressImage(file: File): Promise<File> {
  let sourceFile = file;

  const ext = file.name.split('.').pop()?.toLowerCase();
  const isHeicMime = file.type === 'image/heic' || file.type === 'image/heif';
  const isHeicExt = ext === 'heic' || ext === 'heif';
  // iOS Safari는 HEIC를 자동으로 JPEG 변환해서 넘겨줌 → type이 이미 표준 형식이면 heic2any 불필요
  const alreadyReadable = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
  if ((isHeicMime || isHeicExt) && !alreadyReadable) {
    try {
      const heic2any = (await import('heic2any')).default;
      const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
      const blob = Array.isArray(converted) ? converted[0] : converted;
      sourceFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? '';
      // "already browser readable" = 브라우저가 이미 JPEG 등으로 변환한 경우 → 원본 그대로 사용
      if (!msg.includes('already browser readable')) {
        throw new Error(`HEIC 이미지를 변환할 수 없습니다: ${msg || 'HEIC 변환 실패'}`);
      }
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(sourceFile);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const { width, height } = img;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
      const targetW = Math.round(width * scale);
      const targetH = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(sourceFile);
        return;
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(sourceFile);
            return;
          }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        'image/jpeg',
        JPEG_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(sourceFile); // 압축 실패 시 원본 그대로
    };

    img.src = objectUrl;
  });
}
