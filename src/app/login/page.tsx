export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-black">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-rokPurple mb-6 text-center">Login to ROK AI</h1>
        
        <div className="bg-rokGrayDark p-6 rounded-xl border border-rokGrayBorder">
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
              Sign In
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-rokGrayText">
              Don't have an account? <a href="/register" className="text-rokPurple hover:underline">Register</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}