import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export const ITEM_TYPES = ['Lost', 'Found'] as const;
export const ITEM_CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Accessories', 'Other'] as const;
export const ITEM_STATUSES = ['Open', 'Returned'] as const;

// Fields a client is allowed to send on create/update. `owner`, `_id` and the
// timestamps are always controlled by the server.
export const ITEM_WRITABLE_FIELDS = ['title', 'description', 'type', 'category', 'location', 'date', 'status'] as const;
export const ITEM_REQUIRED_FIELDS = ['title', 'description', 'type', 'category', 'location', 'date'] as const;

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 1000;
export const LOCATION_MAX_LENGTH = 200;

// Case-insensitive comparison ("Black Backpack" === "black backpack") used by
// both the unique index and the duplicate-title lookups in the controller.
export const TITLE_COLLATION = { locale: 'en', strength: 2 } as const;

export type ItemType = (typeof ITEM_TYPES)[number];
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export interface ItemDocument extends Document {
  title: string;
  description: string;
  type: ItemType;
  category: ItemCategory;
  location: string;
  date: Date;
  status: ItemStatus;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<ItemDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH} characters`],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [5, 'Description must be at least 5 characters'],
      maxlength: [DESCRIPTION_MAX_LENGTH, `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`],
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: ITEM_TYPES as unknown as string[],
        message: `Type must be one of: ${ITEM_TYPES.join(', ')}`,
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ITEM_CATEGORIES as unknown as string[],
        message: `Category must be one of: ${ITEM_CATEGORIES.join(', ')}`,
      },
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      minlength: [2, 'Location must be at least 2 characters'],
      maxlength: [LOCATION_MAX_LENGTH, `Location must be at most ${LOCATION_MAX_LENGTH} characters`],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      validate: {
        // An item cannot have been lost/found in the future.
        validator: (value: Date) => value.getTime() <= Date.now(),
        message: 'Date cannot be in the future',
      },
    },
    status: {
      type: String,
      enum: {
        values: ITEM_STATUSES as unknown as string[],
        message: `Status must be one of: ${ITEM_STATUSES.join(', ')}`,
      },
      default: 'Open',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
  },
  { timestamps: true }
);

// Title is the unique field used to prevent duplicate item posts.
itemSchema.index({ title: 1 }, { unique: true, collation: TITLE_COLLATION });

const Item: Model<ItemDocument> = mongoose.model<ItemDocument>('Item', itemSchema);
export default Item;
