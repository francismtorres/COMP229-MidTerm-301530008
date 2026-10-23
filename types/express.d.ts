import type { Types } from 'mongoose';
import type { UserDocument } from '../models/User.js';

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
      userId?: Types.ObjectId;
    }
  }
}

export {};
