import React, { useState } from 'react';

export default function Login({ onLogin, cancelLogin, intendedRole }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Invalid credentials');
      }

      // Strict Role Checking
      if (intendedRole && data.role !== intendedRole) {
        throw new Error(`Access Denied: You cannot access the ${intendedRole} workspace with a ${data.role} account.`);
      }

      localStorage.setItem('triage_token', data.access_token);
      localStorage.setItem('triage_role', data.role);
      onLogin(data.role);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative">
      <video autoPlay loop muted playsInline className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-40 pointer-events-none">
        <source src="/manager-bg.mp4" type="video/mp4" />
      </video>
      <div className="fixed inset-0 bg-slate-900/60 z-0"></div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white tracking-tight">System Login</h2>
          <p className="text-slate-400 text-sm mt-2 font-medium">Authorized personnel only.</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
            <input type="email" required className="w-full bg-slate-800/50 border border-slate-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-slate-500" placeholder="example: name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Password</label>
            <input type="password" required className="w-full bg-slate-800/50 border border-slate-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-slate-500" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-500/30">
            {isLoading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <button onClick={cancelLogin} type="button" className="w-full mt-4 text-slate-400 hover:text-white text-sm font-medium transition-colors">
          ← Return to Customer Portal
        </button>
      </div>
    </div>
  );
}