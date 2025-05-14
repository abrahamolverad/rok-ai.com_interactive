export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-black text-white">
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-purple-500 mb-4">
          ROK AI Interactive
        </h1>
        <p className="text-xl md:text-2xl mb-12">
          Financial Intelligence Platform
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <a 
            href="/dashboard" 
            className="block p-6 border border-gray-700 rounded-lg hover:border-purple-500 transition-colors"
          >
            <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
            <p className="text-gray-400">
              View your financial analytics and trading data.
            </p>
          </a>
          
          <a 
            href="/login" 
            className="block p-6 border border-gray-700 rounded-lg hover:border-purple-500 transition-colors"
          >
            <h2 className="text-2xl font-bold mb-2">Login</h2>
            <p className="text-gray-400">
              Access your account and personalized features.
            </p>
          </a>
        </div>
        
        <p className="text-gray-500">
          ? 2025 ROK AI Interactive. All rights reserved.
        </p>
      </div>
    </div>
  );
}