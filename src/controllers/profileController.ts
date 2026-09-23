import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/initDb';
import { AuthRequest } from '../middleware/auth';

export async function getProfile(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const user = await db('users').where({ id: userId }).select('id', 'name', 'email', 'date_of_birth', 'created_at').first();
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user });
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { name, date_of_birth } = req.body;
  await db('users').where({ id: userId }).update({ name, date_of_birth });
  const user = await db('users').where({ id: userId }).select('id', 'name', 'email', 'date_of_birth', 'created_at').first();
  return res.json({ user });
}

export async function changePassword(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'current_password and new_password are required' });
  }
  const user = await db('users').where({ id: userId }).first();
  const valid = await bcrypt.compare(current_password, user.password);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
  const hashed = await bcrypt.hash(new_password, 10);
  await db('users').where({ id: userId }).update({ password: hashed });
  return res.json({ message: 'Password updated successfully' });
}
