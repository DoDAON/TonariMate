"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-brutal max-w-md w-full p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold font-mono">오류 발생</h2>
        <p className="text-muted-foreground">
          {error.message || "알 수 없는 오류가 발생했습니다."}
        </p>
        <button onClick={reset} className="btn-brutal w-full">
          다시 시도
        </button>
      </div>
    </div>
  );
}
