export default function MyLoading() {
  return (
    <div className="min-h-screen p-4 space-y-4 max-w-2xl mx-auto pt-8">
      <div className="h-8 w-40 bg-muted border-2 border-border animate-pulse rounded-none" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-brutal p-4 space-y-2 animate-pulse">
            <div className="h-5 w-1/2 bg-muted rounded-none" />
            <div className="h-4 w-1/3 bg-muted rounded-none" />
          </div>
        ))}
      </div>
    </div>
  );
}
