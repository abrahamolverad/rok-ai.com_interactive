export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-rokPurple">ROK AI Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-rokGrayDark p-6 rounded-xl border border-rokGrayBorder">
          <h2 className="text-xl font-semibold mb-4 text-rokIvory">Account Summary</h2>
          <div className="space-y-2">
            <p className="text-rokGrayText">Portfolio Value: <span className="text-rokIvory">$12,500.00</span></p>
            <p className="text-rokGrayText">Cash Balance: <span className="text-rokIvory">$10,000.00</span></p>
            <p className="text-rokGrayText">Buying Power: <span className="text-rokIvory">$25,000.00</span></p>
          </div>
        </div>
        
        <div className="bg-rokGrayDark p-6 rounded-xl border border-rokGrayBorder">
          <h2 className="text-xl font-semibold mb-4 text-rokIvory">Performance</h2>
          <div className="space-y-2">
            <p className="text-rokGrayText">Today's P/L: <span className="text-green-500">+$150.00 (1.21%)</span></p>
            <p className="text-rokGrayText">Total P/L: <span className="text-green-500">+$2,500.00 (25.00%)</span></p>
          </div>
        </div>
      </div>
      
      <div className="bg-rokGrayDark p-6 rounded-xl border border-rokGrayBorder mb-8">
        <h2 className="text-xl font-semibold mb-4 text-rokIvory">Positions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-rokGraySubtle uppercase">
              <tr className="border-b border-rokGrayBorder">
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Market Value</th>
                <th className="px-4 py-3">Cost Basis</th>
                <th className="px-4 py-3">Unrealized P/L</th>
                <th className="px-4 py-3">Change Today</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-rokGrayBorder">
                <td className="px-4 py-3 text-rokIvory">AAPL</td>
                <td className="px-4 py-3 text-rokGrayText">10</td>
                <td className="px-4 py-3 text-rokGrayText">$1,750.00</td>
                <td className="px-4 py-3 text-rokGrayText">$1,500.00</td>
                <td className="px-4 py-3 text-green-500">+$250.00 (16.67%)</td>
                <td className="px-4 py-3 text-green-500">+1.45%</td>
              </tr>
              <tr className="border-b border-rokGrayBorder">
                <td className="px-4 py-3 text-rokIvory">MSFT</td>
                <td className="px-4 py-3 text-rokGrayText">5</td>
                <td className="px-4 py-3 text-rokGrayText">$1,500.00</td>
                <td className="px-4 py-3 text-rokGrayText">$1,350.00</td>
                <td className="px-4 py-3 text-green-500">+$150.00 (11.11%)</td>
                <td className="px-4 py-3 text-green-500">+0.42%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}