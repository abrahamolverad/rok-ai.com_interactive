export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-black">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-rokPurple mb-6 text-center">Create Account</h1>
        
        <div className="bg-rokGrayDark p-6 rounded-xl border border-rokGrayBorder">
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-rokGrayText mb-1">Name</label>
              <input 
                id="name"
                type="text" 
                className="w-full p-2 rounded bg-rokGrayInput border border-rokGrayBorder text-rokIvory"
                placeholder="Enter your name"
              />
            </div>
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
                placeholder="Create a password"
              />
            </div>
            <button 
              type="button" 
              className="w-full bg-rokPurple text-white py-2 px-4 rounded hover:bg-purple-700 transition"
            >
              Register
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-rokGrayText">
              Already have an account? <a href="/login" className="text-rokPurple hover:underline">Login</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}