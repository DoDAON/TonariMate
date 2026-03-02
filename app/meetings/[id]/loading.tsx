export default function MeetingLoading() {
  return (
    <div className="min-h-screen p-4 space-y-4 max-w-2xl mx-auto pt-8 animate-pulse">
      <div className="h-8 w-2/3 bg-muted border-2 border-border rounded-none" />
      <div className="h-4 w-1/3 bg-muted rounded-none" />
      <div className="card-brutal p-4 space-y-3">
        <div className="h-5 w-24 bg-muted rounded-none" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 w-full bg-muted rounded-none" />
        ))}
      </div>
      <div className="card-brutal p-4 space-y-3">
        <div className="h-5 w-24 bg-muted rounded-none" />
        {[1, 2].map((i) => (
          <div key={i} className="h-12 w-full bg-muted rounded-none" />
        ))}
      </div>
    </div>
  );
}
