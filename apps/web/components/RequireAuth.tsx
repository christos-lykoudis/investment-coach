'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tokenStore } from '../lib/tokens';
import { LoadingScreen } from './LoadingScreen';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = tokenStore.getAccessToken();
      const authed = Boolean(token);
      setIsAuthed(authed);
      setChecked(true);
      if (!authed) {
        router.replace('/auth/login');
      }
    };

    checkAuth();
    const unsubscribe = tokenStore.subscribe(checkAuth);
    return unsubscribe;
  }, [router]);

  if (!checked || !isAuthed) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
