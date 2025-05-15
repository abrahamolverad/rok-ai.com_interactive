// src/models/User.ts
import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for the User document
export interface IUser extends Document {
  email: string;
  passwordHash: string; // Store hashed password
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  // Method to compare password
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Mongoose schema for User
const UserSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email address.'],
      unique: true,
      match: [/.+\@.+\..+/, 'Please enter a valid email address.'],
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password.'],
    },
    name: {
      type: String,
      trim: true,
    },
    // You can add other fields like roles, alpaca_api_key (encrypted), etc.
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Method to compare candidate password with the stored hashed password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Prevent recompilation of the model if it already exists
// and ensure the model is always of type Model<IUser>
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
