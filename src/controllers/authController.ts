import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/initDb';

function generateToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
}

export async function register(req: Request, res: Response) {
  const { name, email, password, date_of_birth } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }

  const existing = await db('users').where({ email }).first();
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = uuidv4();

  await db('users').insert({ id, name, email, password: hashedPassword, date_of_birth: date_of_birth || null });

  const token = generateToken(id);
  return res.status(201).json({ token, user: { id, name, email } });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await db('users').where({ email }).first();
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user.id);
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = await db('users').where({ email }).first();
  if (!user) {
    return res.json({ message: 'If that email exists, a reset token has been sent.' });
  }

  const token = uuidv4();
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString();

  await db('password_reset_tokens').insert({ id, user_id: user.id, token, expires_at: expiresAt });

  return res.json({ message: 'Reset token generated (demo mode)', resetToken: token });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  const record = await db('password_reset_tokens').where({ token, used: 0 }).first();

  if (!record) {
    return res.status(400).json({ error: 'Invalid or already used token' });
  }

  if (new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Token has expired' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  await db('users').where({ id: record.user_id }).update({ password: hashedPassword });
  await db('password_reset_tokens').where({ id: record.id }).update({ used: 1 });

  return res.json({ message: 'Password reset successfully' });
}
