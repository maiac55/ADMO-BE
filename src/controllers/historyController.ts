import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/initDb';
import { AuthRequest } from '../middleware/auth';

export async function getHistory(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { date, status } = req.query;

  let query = db('medication_history as h')
    .leftJoin('medications as m', 'h.medication_id', 'm.id')
    .where({ 'h.user_id': userId })
    .orderBy('h.date', 'desc')
    .orderBy('h.scheduled_time', 'asc')
    .select('h.*', 'm.name as medication_name', 'm.dose as medication_dose');

  if (date) query = query.where({ 'h.date': date });
  if (status) query = query.where({ 'h.status': status });

  const history = await query;
  return res.json({ history });
}

export async function logHistory(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { medication_id, status, scheduled_time, taken_at, date } = req.body;

  if (!medication_id || !status || !scheduled_time || !date) {
    return res.status(400).json({ error: 'medication_id, status, scheduled_time and date are required' });
  }

  const id = uuidv4();
  await db('medication_history').insert({
    id, medication_id, user_id: userId,
    status, scheduled_time,
    taken_at: taken_at || null,
    date,
  });

  const record = await db('medication_history').where({ id }).first();
  return res.status(201).json({ record });
}
