import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { HeaderActions } from '@/components/layouts/HeaderActions';
import { requireAdmin } from '@/lib/queries/admin';
import { getAnnouncementById } from '@/lib/queries/announcements';
import { AnnouncementForm } from '@/components/features/admin/AnnouncementForm';

interface EditAnnouncementPageProps {
  params: Promise<{ id: string; announcementId: string }>;
}

export default async function EditAnnouncementPage({ params }: EditAnnouncementPageProps) {
  const { id: meetingId, announcementId } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect(ROUTES.LOGIN);

  await requireAdmin(user.id);

  const announcement = await getAnnouncementById(announcementId);
  if (!announcement || announcement.meeting_id !== meetingId) notFound();

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<HeaderActions />} />

      <main className="container mx-auto px-4 py-8">
        <nav className="mb-6">
          <Link
            href={ROUTES.ADMIN_MEETING_ANNOUNCEMENTS(meetingId)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← 공지사항 목록으로 돌아가기
          </Link>
        </nav>

        <h1 className="text-2xl font-black uppercase tracking-tight mb-6">공지사항 수정</h1>

        <AnnouncementForm
          meetingId={meetingId}
          userId={user.id}
          mode="edit"
          announcementId={announcementId}
          defaultValues={{ title: announcement.title, body: announcement.body }}
        />
      </main>
    </div>
  );
}
