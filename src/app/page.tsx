'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">GSC Outsourcing</h1>
          <p className="text-blue-200">Client Portal</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition font-semibold text-lg"
          >
            Client Login
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gray-700 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition font-semibold text-lg"
          >
            Manager Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
