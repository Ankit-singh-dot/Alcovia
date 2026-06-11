


import { Router, Request, Response } from 'express';
import { serverStore } from '../store/server-store';
import { fireWebhookIfNeeded } from '../services/webhook-service';
import { SyncRequest, SyncResponse, Operation } from '../types';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const syncReq: SyncRequest = req.body;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[SYNC] Device: ${syncReq.deviceId}`);
    console.log(`[SYNC] Incoming operations: ${syncReq.operations.length}`);
    console.log(`[SYNC] Last sync counter: ${syncReq.lastSyncCounter}`);

    // Step 1: Process incoming operations (with dedup)
    const newOps = serverStore.processOperations(syncReq.operations);
    console.log(`[SYNC] New operations after dedup: ${newOps.length}`);

    // Step 2: Fire webhooks for any newly completed focus sessions
    const notifications: any[] = [];
    for (const op of newOps) {
      if (op.type === 'FOCUS_SESSION_COMPLETE') {
        const payload = op.payload as any;
        const event = await fireWebhookIfNeeded(
          payload.sessionId,
          syncReq.studentId,
          payload.actualDuration
        );
        if (event) {
          notifications.push(event);
        }
      }
    }

    // Step 3: Get operations this device hasn't seen
    const { ops: opsForDevice, newCounter } = serverStore.getOperationsSince(
      syncReq.lastSyncCounter,
      syncReq.deviceId
    );
    console.log(`[SYNC] Sending ${opsForDevice.length} ops back to device`);
    console.log(`[SYNC] New sync counter: ${newCounter}`);

    // Step 4: Respond with state + new ops + notifications
    const response: SyncResponse = {
      operations: opsForDevice,
      state: serverStore.getState(),
      syncCounter: newCounter,
      notifications: serverStore.getNotifications(),
    };

    res.json(response);
  } catch (error) {
    console.error('[SYNC] Error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

export default router;
