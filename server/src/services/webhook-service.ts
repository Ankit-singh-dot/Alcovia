

import { serverStore } from '../store/server-store';
import { WebhookPayload, NotificationEvent } from '../types';

// The n8n webhook URL — configure this when n8n is running
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/focus-complete';

export async function fireWebhookIfNeeded(
  sessionId: string,
  studentId: string,
  focusMinutes: number
): Promise<NotificationEvent | null> {
  // CHECK: Has this session already triggered a webhook?
  if (!serverStore.shouldFireWebhook(sessionId)) {
    return null; // Already fired, skip
  }

  const stats = serverStore.getStats();
  const coinsEarned = Math.max(10, Math.floor(focusMinutes / 5) * 10);

  const payload: WebhookPayload = {
    sessionId,
    studentId,
    streak: stats.streak,
    coins: stats.coins,
    coinsEarned,
    focusMinutes,
    message: `🎯 Great focus! Streak now ${stats.streak} day${stats.streak !== 1 ? 's' : ''}, +${coinsEarned} coins earned.`,
  };

  console.log(`[WEBHOOK] Firing for session ${sessionId}: ${payload.message}`);

  // Try to fire the real n8n webhook
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.log(`[WEBHOOK] n8n returned ${response.status}, falling back to mock`);
    }
  } catch (error) {
    // n8n might not be running — that's OK, the mock endpoint is our fallback
    console.log(`[WEBHOOK] n8n unreachable, notification logged locally`);
  }

  // Always record the notification event
  const event: NotificationEvent = {
    sessionId,
    message: payload.message,
    firedAt: new Date().toISOString(),
  };

  serverStore.addNotification(event);
  return event;
}
