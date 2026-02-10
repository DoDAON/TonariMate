interface ProfileCardProps {
  name: string;
  email: string;
  avatarUrl?: string | null;
  studentId?: string | null;
  onEdit?: () => void;
}

export function ProfileCard({ name, email, avatarUrl, studentId, onEdit }: ProfileCardProps) {
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
        <div className="flex-1">
          <h2 className="text-xl font-bold">{name}</h2>
          <p className="text-muted-foreground text-sm font-mono">{email}</p>
          {studentId && (
            <p className="text-muted-foreground text-sm">학번: {studentId}</p>
          )}
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="btn-brutal text-sm px-4 py-2"
          >
            수정
          </button>
        )}
      </div>
    </section>
  );
}
