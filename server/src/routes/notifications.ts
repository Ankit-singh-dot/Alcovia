

import { Router, Request, Response } from 'express';

const router = Router();


const receivedNotifications: Array<{
  timestamp: string;
  payload: any;
}> = [];


router.post('/mock', (req: Request, res: Response) => {
  const payload = req.body;
  
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📱 [NOTIFICATION RECEIVED]`);
  console.log(`   Session: ${payload.sessionId}`);
  console.log(`   Message: ${payload.message}`);
  console.log(`   Student: ${payload.studentId}`);
  console.log(`   Streak: ${payload.streak}, Coins: ${payload.coins}`);
  console.log(`${'─'.repeat(60)}\n`);

  receivedNotifications.push({
    timestamp: new Date().toISOString(),
    payload,
  });

  res.json({ success: true, message: 'Notification logged' });
});

// GET /api/notifications — Dev panel fetches notification history
router.get('/', (_req: Request, res: Response) => {
  res.json(receivedNotifications);
});

export default router;
