const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;

/**
 * Canvas API를 이용해 이미지를 압축합니다.
 * - 최대 1920px로 리사이즈 (비율 유지)
 * - JPEG quality 0.85로 인코딩
 * - 원본이 이미 작다면 그대로 반환
 */
export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

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
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
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
      resolve(file); // 압축 실패 시 원본 그대로
    };

    img.src = objectUrl;
  });
}
