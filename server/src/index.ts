

import express from 'express';
import cors from 'cors';
import syncRouter from './routes/sync';
import notificationsRouter from './routes/notifications';

const app = express();
const PORT = process.env.PORT || 3001;


app.use(cors());
app.use(express.json({ limit: '10mb' }));


app.use((req, _res, next) => {
  if (req.path !== '/api/notifications') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});


app.use('/api/sync', syncRouter);
app.use('/api/notifications', notificationsRouter);


app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.listen(PORT, () => {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Alcovia Server running on http://localhost:${PORT}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Endpoints:`);
  console.log(`    POST /api/sync           — Sync endpoint`);
  console.log(`    POST /api/notifications/mock — Mock notification sink`);
  console.log(`    GET  /api/notifications  — Notification history`);
  console.log(`    GET  /api/health         — Health check`);
  console.log(`${'═'.repeat(60)}\n`);
});
