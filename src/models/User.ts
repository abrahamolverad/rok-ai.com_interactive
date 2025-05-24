// src/models/User.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

// Interface for the User document
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Password can be optional if users can also sign up via OAuth (e.g. Google)
  createdAt: Date;
  updatedAt: Date;
  // You might add other fields here later, e.g.:
  // image?: string;
  // emailVerified?: Date | null;
  // role?: string;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, // Ensures no two users can have the same email
      lowercase: true, 
      trim: true 
    },
    password: { 
      type: String, 
      // Not strictly required: false here if you allow OAuth sign-ups that don't set a password
      // For credentials provider, it will be required by your `authorize` logic
      required: false, 
      minlength: 6 // Good to have a minimum length
    }, 
    // Example of other fields you might add for OAuth integration or user profile
    // image: { type: String },
    // emailVerified: { type: Date, default: null },
    // role: { type: String, default: 'user' }
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Prevent Mongoose model recompilation error in Next.js hot-reload environments
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);