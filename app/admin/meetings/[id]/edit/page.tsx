import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { HeaderActions } from '@/components/layouts/HeaderActions';
import { MeetingForm } from '@/components/features/admin/MeetingForm';
import { MeetingActionButtons } from '@/components/features/admin/MeetingActionButtons';
import { requireAdmin } from '@/lib/queries/admin';

interface EditMeetingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMeetingPage({ params }: EditMeetingPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  await requireAdmin(user.id);

  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('name, description, period, is_active')
    .eq('id', id)
    .single();

  if (error || !meeting) {
    notFound();
  }

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<HeaderActions />} />

      <main className="container mx-auto px-4 py-8">
        <nav className="mb-6">
          <Link
            href={ROUTES.ADMIN_MEETING(id)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← 모임 관리로 돌아가기
          </Link>
        </nav>

        <h1 className="text-3xl font-black uppercase tracking-tight mb-8">
          모임 수정
        </h1>

        <MeetingForm
          userId={user.id}
          mode="edit"
          meetingId={id}
          defaultValues={meeting}
        />

        <div className="mt-8 border-t-2 border-border pt-8">
          <h2 className="text-lg font-black uppercase tracking-tight mb-4">모임 종료 / 삭제</h2>
          <MeetingActionButtons
            meetingId={id}
            meetingName={meeting.name}
            isActive={meeting.is_active}
          />
        </div>
      </main>
    </div>
  );
}
