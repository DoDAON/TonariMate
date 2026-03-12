import type { Announcement } from '@/lib/queries/announcements';

interface AnnouncementSectionProps {
  announcements: Announcement[];
}

export function AnnouncementSection({ announcements }: AnnouncementSectionProps) {
  if (announcements.length === 0) return null;

  return (
    <div className="space-y-3">
      {announcements.map((a) => (
        <div key={a.id} className="card-brutal">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="font-black text-base">{a.title}</h3>
            <time className="text-xs text-muted-foreground font-mono shrink-0">
              {new Date(a.created_at).toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
              })}
            </time>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.body}</p>
        </div>
      ))}
    </div>
  );
}
