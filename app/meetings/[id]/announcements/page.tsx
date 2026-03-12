import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { HeaderActions } from '@/components/layouts/HeaderActions';
import { getMeetingAnnouncementsPaged } from '@/lib/queries/announcements';

interface AnnouncementsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

const PAGE_SIZE = 10;

export default async function AnnouncementsPage({ params, searchParams }: AnnouncementsPageProps) {
  const { id } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1);

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 멤버십 확인
  const { data: membership } = await supabase
    .from('meeting_members')
    .select('id')
    .eq('meeting_id', id)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    notFound();
  }

  const { data: announcements, total } = await getMeetingAnnouncementsPaged(id, page, PAGE_SIZE);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<HeaderActions />} />

      <main className="container mx-auto px-4 py-8">
        <Link
          href={ROUTES.MEETING(id)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          &larr; 모임으로 돌아가기
        </Link>

        <h1 className="text-2xl font-bold uppercase mb-6">공지사항</h1>

        {announcements.length === 0 ? (
          <div className="card-brutal opacity-60">
            <p className="text-sm text-muted-foreground">등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div key={item.id} className="card-brutal space-y-2">
                <p className="font-bold">{item.title}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.body}</p>
                <p className="text-xs font-mono text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {page > 1 && (
              <Link
                href={`${ROUTES.MEETING_ANNOUNCEMENTS(id)}?page=${page - 1}`}
                className="px-3 py-1.5 text-sm font-bold border-2 border-foreground hover:translate-x-[-1px] hover:translate-y-[-1px] hover:[box-shadow:2px_2px_0_var(--foreground)] active:translate-x-[1px] active:translate-y-[1px] transition-all duration-100"
              >
                &larr;
              </Link>
            )}
            <span className="text-sm font-mono text-muted-foreground">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`${ROUTES.MEETING_ANNOUNCEMENTS(id)}?page=${page + 1}`}
                className="px-3 py-1.5 text-sm font-bold border-2 border-foreground hover:translate-x-[-1px] hover:translate-y-[-1px] hover:[box-shadow:2px_2px_0_var(--foreground)] active:translate-x-[1px] active:translate-y-[1px] transition-all duration-100"
              >
                &rarr;
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
