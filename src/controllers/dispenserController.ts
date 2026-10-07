import { Response } from 'express';
import { db } from '../config/initDb';
import { AuthRequest } from '../middleware/auth';
import { sendAlert } from '../services/dispenser';

const SLOTS = ['morning', 'noon', 'evening'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function getSlots(_req: AuthRequest, res: Response) {
  const slots = await db('dispenser_slots');
  slots.sort((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot));
  return res.json({ slots });
}

export async function updateSlots(req: AuthRequest, res: Response) {
  for (const slot of SLOTS) {
    if (!TIME_RE.test(req.body[slot] || '')) {
      return res.status(400).json({ error: `Invalid time for ${slot} (use HH:MM)` });
    }
  }
  for (const slot of SLOTS) {
    await db('dispenser_slots').where({ slot }).update({ time: req.body[slot] });
  }
  return res.json({ message: 'Saved' });
}

// Demo test button: sends "alert" immediately, without waiting for the time
export function testAlert(_req: AuthRequest, res: Response) {
  return res.json({ sent: sendAlert() });
}
