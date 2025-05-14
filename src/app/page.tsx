import React from 'react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 bg-black text-white">
      <div className="w-full text-center">
        <h1 className="text-4xl font-bold text-rokPurple mb-4">
          ROK AI Interactive
        </h1>
        <h2 className="text-2xl mb-8">
          Financial Intelligence Platform
        </h2>
        
        <p className="mb-4">Welcome to ROK AI's interactive trading platform.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
          <div className="border border-rokGrayBorder p-4 rounded">
            <h3 className="text-xl mb-2">Dashboard</h3>
            <p>Financial insights and analytics dashboard.</p>
            <a href="/dashboard" className="text-rokPurple hover:underline">Go to Dashboard ?</a>
          </div>
          
          <div className="border border-rokGrayBorder p-4 rounded">
            <h3 className="text-xl mb-2">Contact Us</h3>
            <p className="text-rokGrayText mb-4">For questions or support, please contact our team.</p>
            <a href="mailto:contact@rokai.com" className="text-rokPurple hover:underline">Email Us ?</a>
          </div>
        </div>
      </div>
    </main>
  );
}