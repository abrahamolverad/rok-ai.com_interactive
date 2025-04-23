import { Schema, model, models, Document } from 'mongoose';

// Define interface for TypeScript
export interface IMessage extends Document {
  name: string;
  email: string;
  message: string;
  createdAt: Date;
}

// Create schema
const MessageSchema = new Schema<IMessage>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create model (check if it already exists to prevent Next.js hot-reloading issues)
export const Message = models.Message || model<IMessage>('Message', MessageSchema);
