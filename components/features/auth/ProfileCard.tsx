interface ProfileCardProps {
  name: string;
  email: string;
  avatarUrl?: string | null;
  studentId?: string | null;
}

export function ProfileCard({ name, email, avatarUrl, studentId }: ProfileCardProps) {
  return (
    <section className="card-brutal">
      <div className="flex items-center gap-4">
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt={name}
            className="w-14 h-14 border-2 border-foreground"
          />
        )}
        <div>
          <h2 className="text-xl font-bold">{name}</h2>
          <p className="text-muted-foreground text-sm font-mono">{email}</p>
          {studentId && (
            <p className="text-muted-foreground text-sm">학번: {studentId}</p>
          )}
        </div>
      </div>
    </section>
  );
}
