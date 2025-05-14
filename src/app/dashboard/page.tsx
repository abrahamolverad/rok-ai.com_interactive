export default function Dashboard() {
  return (
    <div className="p-8 min-h-screen bg-black text-white">
      <h1 className="text-3xl font-bold mb-8 text-purple-500">ROK AI Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-100">Account Summary</h2>
          <div className="space-y-2">
            <p className="text-gray-400">Portfolio Value: <span className="text-white">$12,500.00</span></p>
            <p className="text-gray-400">Cash Balance: <span className="text-white">$10,000.00</span></p>
            <p className="text-gray-400">Buying Power: <span className="text-white">$25,000.00</span></p>
          </div>
        </div>
        
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-100">Performance</h2>
          <div className="space-y-2">
            <p className="text-gray-400">Today's P/L: <span className="text-green-500">+$150.00 (1.21%)</span></p>
            <p className="text-gray-400">Total P/L: <span className="text-green-500">+$2,500.00 (25.00%)</span></p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-100">Positions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-400 uppercase">
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Market Value</th>
                <th className="px-4 py-3">Unrealized P/L</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700">
                <td className="px-4 py-3 text-gray-100">AAPL</td>
                <td className="px-4 py-3 text-gray-400">10</td>
                <td className="px-4 py-3 text-gray-400">$1,750.00</td>
                <td className="px-4 py-3 text-green-500">+$250.00 (16.67%)</td>
              </tr>
              <tr className="border-b border-gray-700">
                <td className="px-4 py-3 text-gray-100">MSFT</td>
                <td className="px-4 py-3 text-gray-400">5</td>
                <td className="px-4 py-3 text-gray-400">$1,500.00</td>
                <td className="px-4 py-3 text-green-500">+$150.00 (11.11%)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div>
        <a href="/" className="text-purple-500 hover:underline">? Back to Home</a>
      </div>
    </div>
  );
}