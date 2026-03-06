'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ImageWithLightboxProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
}

export function ImageWithLightbox({
  src,
  alt,
  className,
  containerClassName,
  fill,
  width,
  height,
  sizes,
}: ImageWithLightboxProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`block w-full cursor-zoom-in ${containerClassName ?? ''}`}
        aria-label="이미지 크게 보기"
      >
        {fill ? (
          <div className="relative w-full h-full">
            <Image src={src} alt={alt} fill className={className} sizes={sizes} />
          </div>
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width ?? 600}
            height={height ?? 400}
            className={className}
            sizes={sizes}
          />
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4"
          style={{ touchAction: 'none' }}
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[90vh] object-contain border-2 border-border"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
