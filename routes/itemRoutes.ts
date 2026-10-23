import { Router } from 'express';
import requireAuth from '../middleware/auth.js';
import {
  validateObjectId,
  validateItemQuery,
  validateCreateItem,
  validateUpdateItem,
} from '../middleware/validateItem.js';
import {
  listItems,
  listMyItems,
  getItemById,
  createItem,
  updateItem,
  deleteMyItems,
  deleteItem,
} from '../controllers/itemController.js';

const router = Router();

// NOTE: `/mine` is declared BEFORE `/:id` so Express doesn't treat
// the literal string "mine" as an :id value.

/**
 * @openapi
 * /api/items:
 *   get:
 *     tags: [Items]
 *     summary: List all items (public)
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [Lost, Found] }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [Electronics, Clothing, Books, Accessories, Other] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Open, Returned] }
 *     responses:
 *       200:
 *         description: Array of items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 */
router.get('/', validateItemQuery, listItems);                                        // GET    /api/items

/**
 * @openapi
 * /api/items/mine:
 *   get:
 *     tags: [Items]
 *     summary: List items owned by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *       401:
 *         description: Missing or invalid token
 */
router.get('/mine', requireAuth, listMyItems);                                        // GET    /api/items/mine

/**
 * @openapi
 * /api/items/{id}:
 *   get:
 *     tags: [Items]
 *     summary: Get a single item by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Invalid id
 *       404:
 *         description: Not found
 */
router.get('/:id', validateObjectId, getItemById);                                    // GET    /api/items/:id

/**
 * @openapi
 * /api/items:
 *   post:
 *     tags: [Items]
 *     summary: Create a new item
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ItemInput'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Missing or invalid token
 *       409:
 *         description: An item with the same title already exists
 */
router.post('/', requireAuth, validateCreateItem, createItem);                        // POST   /api/items

/**
 * @openapi
 * /api/items/{id}:
 *   put:
 *     tags: [Items]
 *     summary: Update an item owned by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ItemInput'
 *     responses:
 *       200:
 *         description: Updated item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Invalid id or validation error
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Not found
 *       409:
 *         description: Another item already uses this title
 */
router.put('/:id', requireAuth, validateObjectId, validateUpdateItem, updateItem);    // PUT    /api/items/:id

/**
 * @openapi
 * /api/items/mine:
 *   delete:
 *     tags: [Items]
 *     summary: Delete all items owned by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deletion summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deletedCount: { type: integer, example: 3 }
 *       401:
 *         description: Missing or invalid token
 */
router.delete('/mine', requireAuth, deleteMyItems);                                   // DELETE /api/items/mine

/**
 * @openapi
 * /api/items/{id}:
 *   delete:
 *     tags: [Items]
 *     summary: Delete a single item owned by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Not found
 */
router.delete('/:id', requireAuth, validateObjectId, deleteItem);                     // DELETE /api/items/:id

export default router;
