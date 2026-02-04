'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-sm rounded-xl bg-zinc-900 p-8 shadow-lg">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Simply Music Admin
        </h1>

        <input
          className="w-full mb-3 px-4 py-2 rounded bg-zinc-800 outline-none"
          placeholder="Username"
          value={user}
          onChange={e => setUser(e.target.value)}
        />

        <input
          className="w-full mb-5 px-4 py-2 rounded bg-zinc-800 outline-none"
          type="password"
          placeholder="Password"
          value={pass}
          onChange={e => setPass(e.target.value)}
        />

        <button
          className="w-full bg-white text-black py-2 rounded font-medium"
          onClick={() => alert('Login wired next')}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
