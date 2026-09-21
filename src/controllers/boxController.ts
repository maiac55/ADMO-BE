import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/initDb';
import { AuthRequest } from '../middleware/auth';

export async function connectBox(req: AuthRequest, res: Response) {
  const { device_code } = req.body;
  const userId = req.userId!;

  if (!device_code) {
    return res.status(400).json({ error: 'Device code is required' });
  }

  const existing = await db('boxes').where({ device_code }).first();
  if (existing) {
    return res.status(409).json({ error: 'This device code is already connected' });
  }

  const id = uuidv4();
  await db('boxes').insert({ id, device_code, user_id: userId });

  const box = await db('boxes').where({ id }).first();
  return res.status(201).json({ box });
}

export async function setPersonInfo(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { person_name, person_age, note } = req.body;
  const userId = req.userId!;

  const box = await db('boxes').where({ id, user_id: userId }).first();
  if (!box) {
    return res.status(404).json({ error: 'Box not found' });
  }

  await db('boxes').where({ id }).update({
    person_name: person_name || null,
    person_age: person_age || null,
    note: note || null,
  });

  const updated = await db('boxes').where({ id }).first();
  return res.json({ box: updated });
}

export async function getAllBoxes(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const boxes = await db('boxes').where({ user_id: userId }).orderBy('connected_at', 'desc');
  return res.json({ boxes });
}

export async function getBox(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.userId!;

  const box = await db('boxes').where({ id, user_id: userId }).first();
  if (!box) {
    return res.status(404).json({ error: 'Box not found' });
  }

  return res.json({ box });
}

export async function deleteBox(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.userId!;

  const box = await db('boxes').where({ id, user_id: userId }).first();
  if (!box) {
    return res.status(404).json({ error: 'Box not found' });
  }

  await db('boxes').where({ id }).delete();
  return res.json({ message: 'Box removed successfully' });
}
