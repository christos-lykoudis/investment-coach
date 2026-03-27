'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NavBar } from './NavBar';
import { tokenStore } from '../lib/tokens';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthed(Boolean(tokenStore.getAccessToken()));
    };
    syncAuth();
    return tokenStore.subscribe(syncAuth);
  }, []);

  const logout = () => {
    tokenStore.clear();
    router.replace('/auth/login');
  };

  return (
    <div className='min-h-screen'>
      <NavBar isAuthed={isAuthed} onLogout={logout} />
      <main className='mx-auto max-w-[980px] px-4 py-10'>{children}</main>
    </div>
  );
}
