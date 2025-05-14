// Placeholder for User model

// Mock user schema
const userSchema = {
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
};

// Mock User model with simple functionality
const User = {
  findOne: async (query) => {
    console.log('Mock User.findOne called with:', query);
    return null; // Simulates no user found
  },
  create: async (userData) => {
    console.log('Mock User.create called with:', userData);
    return { 
      ...userData,
      _id: 'mock-user-id-' + Math.random().toString(36).substr(2, 9),
      password: '[hashed-password]',
      createdAt: new Date()
    };
  }
};

export default User;