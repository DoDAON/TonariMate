export default function AdminLoading() {
  return (
    <div className="min-h-screen p-4 space-y-4 max-w-4xl mx-auto pt-8 animate-pulse">
      <div className="h-8 w-48 bg-muted border-2 border-border rounded-none" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card-brutal p-4 space-y-2">
            <div className="h-5 w-1/2 bg-muted rounded-none" />
            <div className="h-4 w-1/3 bg-muted rounded-none" />
          </div>
        ))}
      </div>
    </div>
  );
}
