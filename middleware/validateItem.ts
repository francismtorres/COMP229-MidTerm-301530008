import type { Request, Response, NextFunction } from 'express';
import { isValidObjectId } from 'mongoose';
import {
  ITEM_TYPES,
  ITEM_CATEGORIES,
  ITEM_STATUSES,
  ITEM_WRITABLE_FIELDS,
  ITEM_REQUIRED_FIELDS,
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  LOCATION_MAX_LENGTH,
} from '../models/Item.js';

// ----------------------------------------------------------------------------
// HTTP input validation for the Item routes. These checks run before the
// controller so obviously bad requests get a clear 400 without touching the
// database. Mongoose schema validation still runs on save as a second layer.
// ----------------------------------------------------------------------------

const STRING_LIMITS: Record<string, number> = {
  title: TITLE_MAX_LENGTH,
  description: DESCRIPTION_MAX_LENGTH,
  location: LOCATION_MAX_LENGTH,
};

const ENUMS: Record<string, readonly string[]> = {
  type: ITEM_TYPES,
  category: ITEM_CATEGORIES,
  status: ITEM_STATUSES,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Rejects `:id` values that are not a valid 24-char hex MongoDB ObjectId. */
export function validateObjectId(req: Request, res: Response, next: NextFunction): Response | void {
  if (!isValidObjectId(req.params.id) || !/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ error: `Invalid item id: ${req.params.id}` });
  }
  next();
}

/** Rejects unknown values for the `?type=`, `?category=` and `?status=` filters. */
export function validateItemQuery(req: Request, res: Response, next: NextFunction): Response | void {
  for (const key of ['type', 'category', 'status']) {
    const value = req.query[key];
    if (value === undefined) continue;
    if (typeof value !== 'string' || !ENUMS[key].includes(value)) {
      return res.status(400).json({
        error: `Invalid ${key} filter. Must be one of: ${ENUMS[key].join(', ')}`,
      });
    }
  }
  next();
}

function validateBody(req: Request, mode: 'create' | 'update'): string[] {
  const body = req.body;
  if (!isPlainObject(body)) {
    return ['Request body must be a JSON object'];
  }

  const errors: string[] = [];
  const keys = Object.keys(body);

  if (mode === 'update' && keys.length === 0) {
    return ['Request body must contain at least one field to update'];
  }

  if ('owner' in body) {
    errors.push('owner cannot be set by the client');
  }

  const unknown = keys.filter(
    (k) => k !== 'owner' && !(ITEM_WRITABLE_FIELDS as readonly string[]).includes(k)
  );
  if (unknown.length > 0) {
    errors.push(`Unknown field(s): ${unknown.join(', ')}. Allowed: ${ITEM_WRITABLE_FIELDS.join(', ')}`);
  }

  // null would bypass enum checks and schema defaults (e.g. status: null).
  // On create, required fields already report "is required" for null.
  for (const k of keys) {
    const reported = k === 'owner' || (mode === 'create' && (ITEM_REQUIRED_FIELDS as readonly string[]).includes(k));
    if (body[k] === null && !reported) errors.push(`${k} cannot be null`);
  }

  if (mode === 'create') {
    for (const field of ITEM_REQUIRED_FIELDS) {
      const value = body[field];
      if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`${field} is required`);
      }
    }
  }

  for (const [field, max] of Object.entries(STRING_LIMITS)) {
    if (body[field] === undefined || body[field] === null) continue;
    if (typeof body[field] !== 'string') {
      errors.push(`${field} must be a string`);
    } else if ((body[field] as string).trim() === '' && mode === 'update') {
      errors.push(`${field} cannot be empty`);
    } else if ((body[field] as string).trim().length > max) {
      errors.push(`${field} must be at most ${max} characters`);
    }
  }

  for (const [field, allowed] of Object.entries(ENUMS)) {
    if (body[field] === undefined || body[field] === null) continue;
    if (!allowed.includes(body[field] as string)) {
      errors.push(`${field} must be one of: ${allowed.join(', ')}`);
    }
  }

  if (body.date !== undefined && body.date !== null) {
    const parsed = new Date(body.date as string);
    if (typeof body.date !== 'string' || Number.isNaN(parsed.getTime())) {
      errors.push('date must be a valid ISO 8601 date (e.g. 2026-10-20)');
    } else if (parsed.getTime() > Date.now()) {
      errors.push('date cannot be in the future');
    }
  }

  return errors;
}

export function validateCreateItem(req: Request, res: Response, next: NextFunction): Response | void {
  const errors = validateBody(req, 'create');
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  next();
}

export function validateUpdateItem(req: Request, res: Response, next: NextFunction): Response | void {
  const errors = validateBody(req, 'update');
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  next();
}
