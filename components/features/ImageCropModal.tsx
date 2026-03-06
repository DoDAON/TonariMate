'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface ImageCropModalProps {
  file: File;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

const CANVAS_SIZE = 300;
const OUTPUT_SIZE = 400;
const MIN_SCALE_RATIO = 1; // 이미지가 항상 캔버스 전체를 덮어야 함
const MAX_SCALE_MULTIPLIER = 5;

interface CropState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function ImageCropModal({ file, onConfirm, onCancel }: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const stateRef = useRef<CropState>({ scale: 1, offsetX: 0, offsetY: 0 });

  // 포인터 추적 (drag + pinch)
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDistRef = useRef<number | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // CSS px → canvas px 변환 비율 계산
  function getCssScale(): number {
    const canvas = canvasRef.current;
    if (!canvas) return 1;
    const rect = canvas.getBoundingClientRect();
    return CANVAS_SIZE / rect.width;
  }

  // 이미지가 캔버스를 벗어나지 않도록 clamp
  function clampOffset(offsetX: number, offsetY: number, scale: number): { offsetX: number; offsetY: number } {
    const img = imgRef.current;
    if (!img) return { offsetX, offsetY };
    const iw = img.naturalWidth * scale;
    const ih = img.naturalHeight * scale;
    return {
      offsetX: Math.max(CANVAS_SIZE - iw, Math.min(0, offsetX)),
      offsetY: Math.max(CANVAS_SIZE - ih, Math.min(0, offsetY)),
    };
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { scale, offsetX, offsetY } = stateRef.current;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.drawImage(img, offsetX, offsetY, img.naturalWidth * scale, img.naturalHeight * scale);

    // 테두리 강조
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, CANVAS_SIZE - 2, CANVAS_SIZE - 2);
  }, []);

  // 이미지 로드 + 초기 scale 계산
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const minScale = Math.max(CANVAS_SIZE / img.naturalWidth, CANVAS_SIZE / img.naturalHeight);
      stateRef.current = {
        scale: minScale,
        offsetX: (CANVAS_SIZE - img.naturalWidth * minScale) / 2,
        offsetY: (CANVAS_SIZE - img.naturalHeight * minScale) / 2,
      };
      setLoaded(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (loaded) draw();
  }, [loaded, draw]);

  // ESC 닫기
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  // ── Pointer 이벤트 핸들러 ──

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastPinchDistRef.current = null;
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const pointers = pointersRef.current;
    if (!pointers.has(e.pointerId)) return;

    const prev = pointers.get(e.pointerId)!;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const cssScale = getCssScale();

    if (pointers.size === 1) {
      // 드래그 이동
      const dx = (e.clientX - prev.x) * cssScale;
      const dy = (e.clientY - prev.y) * cssScale;
      const { scale, offsetX, offsetY } = stateRef.current;
      const clamped = clampOffset(offsetX + dx, offsetY + dy, scale);
      stateRef.current = { scale, ...clamped };
      draw();
    } else if (pointers.size === 2) {
      // 핀치 줌
      const pts = Array.from(pointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (lastPinchDistRef.current !== null) {
        applyZoom(dist / lastPinchDistRef.current);
      }
      lastPinchDistRef.current = dist;
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) lastPinchDistRef.current = null;
  }

  function handleWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    applyZoom(e.deltaY > 0 ? 0.9 : 1.1);
  }

  function applyZoom(ratio: number) {
    const img = imgRef.current;
    if (!img) return;
    const minScale = Math.max(CANVAS_SIZE / img.naturalWidth, CANVAS_SIZE / img.naturalHeight);
    const maxScale = minScale * MAX_SCALE_MULTIPLIER;
    const { scale, offsetX, offsetY } = stateRef.current;
    const newScale = Math.max(minScale * MIN_SCALE_RATIO, Math.min(scale * ratio, maxScale));
    // 캔버스 중앙 기준 줌
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    const newOffsetX = cx - (cx - offsetX) * (newScale / scale);
    const newOffsetY = cy - (cy - offsetY) * (newScale / scale);
    const clamped = clampOffset(newOffsetX, newOffsetY, newScale);
    stateRef.current = { scale: newScale, ...clamped };
    draw();
  }

  function handleConfirm() {
    const img = imgRef.current;
    if (!img) return;
    setConfirming(true);

    const { scale, offsetX, offsetY } = stateRef.current;

    // 원본 이미지에서 크롭할 영역 계산
    const srcX = -offsetX / scale;
    const srcY = -offsetY / scale;
    const srcSize = CANVAS_SIZE / scale;

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = OUTPUT_SIZE;
    outputCanvas.height = OUTPUT_SIZE;
    const ctx = outputCanvas.getContext('2d')!;
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    outputCanvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
        setConfirming(false);
      },
      'image/jpeg',
      0.92
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="card-brutal w-full max-w-sm">
        <h3 className="text-lg font-black uppercase mb-1">사진 자르기</h3>
        <p className="text-xs text-muted-foreground mb-3">드래그로 위치 조정 · 스크롤/핀치로 확대축소</p>

        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{ width: '100%', maxWidth: `${CANVAS_SIZE}px`, aspectRatio: '1' }}
            className={`border-2 border-foreground touch-none ${loaded ? 'cursor-grab active:cursor-grabbing' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          />
        </div>

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!loaded || confirming}
            className="btn-brutal flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {confirming ? '처리 중...' : '적용'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-brutal flex-1 bg-muted text-foreground"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
