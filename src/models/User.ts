// src/models/User.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Password is optional
  createdAt: Date;
  updatedAt: Date;
  // image?: string; // Example: if you store Google profile picture
  // emailVerified?: Date | null; // Example: if you track email verification
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    password: { 
      type: String, 
      required: false, // Set to false to allow users created via OAuth without a local password
      minlength: 6 
    }, 
    // image: { type: String },
    // emailVerified: { type: Date, default: null },
  },
  { timestamps: true } 
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);