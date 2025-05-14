import React from 'react';

// Placeholder component until next-auth is properly configured
const LoginForm = () => {
  return (
    <div className="bg-rokGrayDark p-6 rounded-xl border border-rokGrayBorder">
      <h2 className="text-xl font-semibold mb-4 text-rokIvory">Login</h2>
      <form className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-rokGrayText mb-1">Email</label>
          <input 
            id="email"
            type="email" 
            className="w-full p-2 rounded bg-rokGrayInput border border-rokGrayBorder text-rokIvory"
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-rokGrayText mb-1">Password</label>
          <input 
            id="password"
            type="password" 
            className="w-full p-2 rounded bg-rokGrayInput border border-rokGrayBorder text-rokIvory"
            placeholder="Enter your password"
          />
        </div>
        <button 
          type="button" 
          className="w-full bg-rokPurple text-white py-2 px-4 rounded hover:bg-purple-700 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginForm;