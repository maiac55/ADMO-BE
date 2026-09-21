import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './config/initDb';
import authRoutes from './routes/auth';
import boxRoutes from './routes/boxes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/boxes', boxRoutes);

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
