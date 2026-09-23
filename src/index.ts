import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './config/initDb';
import authRoutes from './routes/auth';
import boxRoutes from './routes/boxes';
import medicationRoutes from './routes/medications';
import historyRoutes from './routes/history';
import notificationRoutes from './routes/notifications';
import profileRoutes from './routes/profile';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/boxes', boxRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'ADMO API is running' });
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 ADMO server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('❌ Failed to initialise database:', err);
  process.exit(1);
});
