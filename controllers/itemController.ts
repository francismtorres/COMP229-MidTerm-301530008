// ============================================================================
// Item Controller — COMP229 Mid-Term Test (Week 7)
// Fran's Campus Lost & Found REST API
// Francis Torres — 301530008
// ============================================================================
// Request bodies, query filters and :id params are pre-validated by
// middleware/validateItem.ts. The handlers below focus on persistence,
// ownership rules and mapping database errors to HTTP status codes.
// ============================================================================

import type { Request, Response, NextFunction } from 'express';
import Item, { ITEM_WRITABLE_FIELDS, TITLE_COLLATION } from '../models/Item.js';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;

// Only copy the fields a client is allowed to write; anything else is dropped.
function pickWritable(body: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const field of ITEM_WRITABLE_FIELDS) {
    if (body[field] !== undefined) {
      data[field] = typeof body[field] === 'string' ? (body[field] as string).trim() : body[field];
    }
  }
  return data;
}

// Translates Mongoose / MongoDB errors into a response, or returns null when
// the error is unexpected and should go to the global error handler (500).
function handleDbError(err: unknown, res: Response): Response | null {
  const error = err as Error & { code?: number; errors?: Record<string, { message: string }> };
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.values(error.errors ?? {}).map((e) => e.message),
    });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ error: error.message });
  }
  if (error.code === 11000) {
    return res.status(409).json({ error: 'An item with this title already exists' });
  }
  return null;
}

// Case-insensitive lookup for another item that already uses `title`.
async function titleTaken(title: string, excludeId?: unknown): Promise<boolean> {
  const filter: Record<string, unknown> = { title };
  if (excludeId) filter._id = { $ne: excludeId };
  const existing = await Item.findOne(filter).collation(TITLE_COLLATION).select('_id').lean();
  return existing !== null;
}

// GET /api/items  (public) — optional ?type=, ?category=, ?status= filters
export const listItems: AsyncHandler = async (req, res, next) => {
  try {
    const filter: Record<string, string> = {};
    for (const key of ['type', 'category', 'status']) {
      if (typeof req.query[key] === 'string') filter[key] = req.query[key] as string;
    }

    const items = await Item.find(filter).sort({ createdAt: -1 }).populate('owner', 'name email');
    return res.status(200).json(items);
  } catch (err) {
    next(err);
  }
};

// GET /api/items/mine  (bearer) — only the signed-in user's items
export const listMyItems: AsyncHandler = async (req, res, next) => {
  try {
    const items = await Item.find({ owner: req.userId }).sort({ createdAt: -1 });
    return res.status(200).json(items);
  } catch (err) {
    next(err);
  }
};

// GET /api/items/:id  (public)
export const getItemById: AsyncHandler = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'name email');
    if (!item) {
      return res.status(404).json({ error: `Item not found: ${req.params.id}` });
    }
    return res.status(200).json(item);
  } catch (err) {
    if (handleDbError(err, res)) return;
    next(err);
  }
};

// POST /api/items  (bearer) — owner is always the signed-in user
export const createItem: AsyncHandler = async (req, res, next) => {
  try {
    const data = pickWritable(req.body);

    if (await titleTaken(data.title as string)) {
      return res.status(409).json({ error: `An item with the title "${data.title}" already exists` });
    }

    const item = await Item.create({ ...data, owner: req.userId });
    return res.status(201).json(item);
  } catch (err) {
    if (handleDbError(err, res)) return;
    next(err);
  }
};

// PUT /api/items/:id  (bearer, owner only)
export const updateItem: AsyncHandler = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: `Item not found: ${req.params.id}` });
    }
    if (!item.owner.equals(req.userId)) {
      return res.status(403).json({ error: 'Forbidden: you can only update your own items' });
    }

    const updates = pickWritable(req.body);
    if (typeof updates.title === 'string' && (await titleTaken(updates.title, item._id))) {
      return res.status(409).json({ error: `An item with the title "${updates.title}" already exists` });
    }

    // set() + save() runs the full schema validation (enums, lengths, date).
    item.set(updates);
    await item.save();
    return res.status(200).json(item);
  } catch (err) {
    if (handleDbError(err, res)) return;
    next(err);
  }
};

// DELETE /api/items/mine  (bearer) — removes every item the user owns
export const deleteMyItems: AsyncHandler = async (req, res, next) => {
  try {
    const result = await Item.deleteMany({ owner: req.userId });
    return res.status(200).json({
      message: `Deleted ${result.deletedCount} item(s) owned by ${req.user?.email}`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/items/:id  (bearer, owner only)
export const deleteItem: AsyncHandler = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: `Item not found: ${req.params.id}` });
    }
    if (!item.owner.equals(req.userId)) {
      return res.status(403).json({ error: 'Forbidden: you can only delete your own items' });
    }

    await item.deleteOne();
    return res.status(200).json({ message: 'Item deleted successfully', deletedId: item._id });
  } catch (err) {
    if (handleDbError(err, res)) return;
    next(err);
  }
};

export { Item };
