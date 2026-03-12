import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { HeaderActions } from '@/components/layouts/HeaderActions';
import { requireAdmin } from '@/lib/queries/admin';
import { getMeetingAnnouncements } from '@/lib/queries/announcements';
import { DeleteAnnouncementButton } from '@/components/features/admin/DeleteAnnouncementButton';

interface AnnouncementsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminAnnouncementsPage({ params }: AnnouncementsPageProps) {
  const { id: meetingId } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect(ROUTES.LOGIN);

  await requireAdmin(user.id);

  const announcements = await getMeetingAnnouncements(meetingId);

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<HeaderActions />} />

      <main className="container mx-auto px-4 py-8">
        <nav className="mb-6">
          <Link
            href={ROUTES.ADMIN_MEETING(meetingId)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← 모임 관리로 돌아가기
          </Link>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black uppercase tracking-tight">공지사항 관리</h1>
          <Link href={ROUTES.ADMIN_MEETING_ANNOUNCEMENT_NEW(meetingId)} className="btn-brutal text-sm">
            + 새 공지 작성
          </Link>
        </div>

        {announcements.length === 0 ? (
          <div className="card-brutal opacity-60">
            <p className="text-sm text-muted-foreground">작성된 공지사항이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => (
              <div key={a.id} className="card-brutal">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h2 className="font-black text-base">{a.title}</h2>
                  <time className="text-xs text-muted-foreground font-mono shrink-0">
                    {new Date(a.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4 line-clamp-3">{a.body}</p>
                <div className="flex gap-2 pt-3 border-t-2 border-border">
                  <Link
                    href={ROUTES.ADMIN_MEETING_ANNOUNCEMENT_EDIT(meetingId, a.id)}
                    className="btn-brutal bg-muted text-foreground text-sm"
                  >
                    수정
                  </Link>
                  <DeleteAnnouncementButton
                    announcementId={a.id}
                    meetingId={meetingId}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
