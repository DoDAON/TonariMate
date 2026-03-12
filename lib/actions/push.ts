'use server';

import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? ''
);

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function savePushSubscription(
  userId: string,
  subscription: PushSubscriptionData
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { onConflict: 'user_id,endpoint' }
    );

  if (error) {
    return { success: false, error: '구독 저장에 실패했습니다' };
  }

  return { success: true };
}

export async function sendPushToMeetingMembers(
  meetingId: string,
  title: string,
  body: string,
  url: string
): Promise<void> {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    // VAPID 키 미설정 시 조용히 스킵
    return;
  }

  const supabase = await createClient();

  // 모임 멤버 userId 조회
  const { data: members } = await supabase
    .from('meeting_members')
    .select('user_id')
    .eq('meeting_id', meetingId);

  if (!members || members.length === 0) return;

  const userIds = members.map((m) => m.user_id);

  // 해당 유저들의 푸시 구독 조회
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('user_id', userIds);

  if (!subscriptions || subscriptions.length === 0) return;

  const payload = JSON.stringify({ title, body, url });

  // 병렬 발송 (실패 개별 처리)
  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      )
    )
  );
}
