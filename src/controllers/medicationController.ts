import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/initDb';
import { AuthRequest } from '../middleware/auth';

export async function getMedications(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const medications = await db('medications').where({ user_id: userId }).orderBy('created_at', 'desc');
  for (const med of medications) {
    med.days = JSON.parse(med.days || '[]');
    med.times = await db('medication_times').where({ medication_id: med.id });
  }
  return res.json({ medications });
}

export async function getMedication(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { id } = req.params;
  const med = await db('medications').where({ id, user_id: userId }).first();
  if (!med) return res.status(404).json({ error: 'Medication not found' });
  med.days = JSON.parse(med.days || '[]');
  med.times = await db('medication_times').where({ medication_id: id });
  return res.json({ medication: med });
}

export async function addMedication(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { box_id, name, dose, days, times, active = true } = req.body;
  if (!name || !dose) return res.status(400).json({ error: 'Name and dose are required' });

  const id = uuidv4();
  await db('medications').insert({
    id, box_id: box_id || null, user_id: userId,
    name, dose, active,
    days: JSON.stringify(days || []),
  });

  if (times && Array.isArray(times)) {
    for (const t of times) {
      await db('medication_times').insert({
        id: uuidv4(), medication_id: id,
        label: t.label || '', time: t.time, pills: t.pills || 1,
      });
    }
  }

  const med = await db('medications').where({ id }).first();
  med.days = JSON.parse(med.days || '[]');
  med.times = await db('medication_times').where({ medication_id: id });
  return res.status(201).json({ medication: med });
}

export async function updateMedication(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { id } = req.params;
  const { name, dose, days, times, active } = req.body;

  const med = await db('medications').where({ id, user_id: userId }).first();
  if (!med) return res.status(404).json({ error: 'Medication not found' });

  await db('medications').where({ id }).update({
    name: name ?? med.name,
    dose: dose ?? med.dose,
    active: active ?? med.active,
    days: days ? JSON.stringify(days) : med.days,
  });

  if (times && Array.isArray(times)) {
    await db('medication_times').where({ medication_id: id }).delete();
    for (const t of times) {
      await db('medication_times').insert({
        id: uuidv4(), medication_id: id,
        label: t.label || '', time: t.time, pills: t.pills || 1,
      });
    }
  }

  const updated = await db('medications').where({ id }).first();
  updated.days = JSON.parse(updated.days || '[]');
  updated.times = await db('medication_times').where({ medication_id: id });
  return res.json({ medication: updated });
}

export async function deleteMedication(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { id } = req.params;
  const med = await db('medications').where({ id, user_id: userId }).first();
  if (!med) return res.status(404).json({ error: 'Medication not found' });
  await db('medication_times').where({ medication_id: id }).delete();
  await db('medications').where({ id }).delete();
  return res.json({ message: 'Medication deleted' });
}
