import type { Request, Response, NextFunction } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import User, { type UserDocument } from '../models/User.js';

function signToken(user: UserDocument): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as SignOptions['expiresIn'],
  };
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET as string,
    options
  );
}

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user);

    return res.status(201).json({ token, user });
  } catch (err) {
    const error = err as Error;
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    next(err);
  }
};

export const signin = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    return res.status(200).json({ token, user });
  } catch (err) {
    next(err);
  }
};

export const me = async (req: Request, res: Response): Promise<Response> => {
  return res.status(200).json({ user: req.user });
};
