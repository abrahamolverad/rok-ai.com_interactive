export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-rokPurple">Account Settings</h1>
      
      <div className="bg-rokGrayDark p-6 rounded-xl border border-rokGrayBorder mb-8">
        <h2 className="text-xl font-semibold mb-4 text-rokIvory">API Connections</h2>
        
        <div className="mb-6">
          <h3 className="text-lg mb-2 text-rokIvory">Alpaca API</h3>
          <form className="space-y-4">
            <div>
              <label htmlFor="alpaca_key" className="block text-rokGrayText mb-1">API Key</label>
              <input 
                id="alpaca_key"
                type="password" 
                className="w-full p-2 rounded bg-rokGrayInput border border-rokGrayBorder text-rokIvory"
                placeholder="Enter your Alpaca API key"
              />
            </div>
            <div>
              <label htmlFor="alpaca_secret" className="block text-rokGrayText mb-1">Secret Key</label>
              <input 
                id="alpaca_secret"
                type="password" 
                className="w-full p-2 rounded bg-rokGrayInput border border-rokGrayBorder text-rokIvory"
                placeholder="Enter your Alpaca Secret key"
              />
            </div>
            <div className="flex items-center mb-4">
              <input 
                id="paper_trading" 
                type="checkbox" 
                className="mr-2 h-4 w-4" 
                checked 
              />
              <label htmlFor="paper_trading" className="text-rokGrayText">Use Paper Trading</label>
            </div>
            <button 
              type="button" 
              className="bg-rokPurple text-white py-2 px-4 rounded hover:bg-purple-700 transition"
            >
              Save API Settings
            </button>
          </form>
        </div>
      </div>
      
      <div className="bg-rokGrayDark p-6 rounded-xl border border-rokGrayBorder">
        <h2 className="text-xl font-semibold mb-4 text-rokIvory">User Profile</h2>
        <form className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-rokGrayText mb-1">Name</label>
            <input 
              id="name"
              type="text" 
              className="w-full p-2 rounded bg-rokGrayInput border border-rokGrayBorder text-rokIvory"
              placeholder="Your name" 
              value="User Name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-rokGrayText mb-1">Email</label>
            <input 
              id="email"
              type="email" 
              className="w-full p-2 rounded bg-rokGrayInput border border-rokGrayBorder text-rokIvory"
              placeholder="Your email" 
              value="user@example.com"
              disabled
            />
          </div>
          <button 
            type="button" 
            className="bg-rokPurple text-white py-2 px-4 rounded hover:bg-purple-700 transition"
          >
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
}