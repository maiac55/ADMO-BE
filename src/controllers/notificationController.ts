import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/initDb';
import { AuthRequest } from '../middleware/auth';

export async function getSettings(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  let settings = await db('notification_settings').where({ user_id: userId }).first();
  if (!settings) {
    const id = uuidv4();
    await db('notification_settings').insert({ id, user_id: userId });
    settings = await db('notification_settings').where({ id }).first();
  }
  return res.json({ settings });
}

export async function updateSettings(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { reminders, taken, missed, refill, disconnected, mechanical, frequency } = req.body;

  let settings = await db('notification_settings').where({ user_id: userId }).first();
  if (!settings) {
    const id = uuidv4();
    await db('notification_settings').insert({ id, user_id: userId });
    settings = await db('notification_settings').where({ user_id: userId }).first();
  }

  await db('notification_settings').where({ user_id: userId }).update({
    reminders: reminders ?? settings.reminders,
    taken: taken ?? settings.taken,
    missed: missed ?? settings.missed,
    refill: refill ?? settings.refill,
    disconnected: disconnected ?? settings.disconnected,
    mechanical: mechanical ?? settings.mechanical,
    frequency: frequency ?? settings.frequency,
  });

  const updated = await db('notification_settings').where({ user_id: userId }).first();
  return res.json({ settings: updated });
}
