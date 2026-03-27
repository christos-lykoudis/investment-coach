'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tokenStore } from '../lib/tokens';
import { ToastContainer } from 'react-toastify';

export default function LandingPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      const isAuthed = Boolean(tokenStore.getAccessToken());
      if (isAuthed) {
        router.replace('/dashboard');
        return;
      }
      setChecked(true);
    };
    syncAuth();
    return tokenStore.subscribe(syncAuth);
  }, [router]);

  if (!checked) {
    return <div className='px-5 py-12 text-(--muted)'>Loading…</div>;
  }

  return (
    <>
      <main className='mx-auto max-w-[980px] px-5 py-12'>
        <h1 className='m-0 text-[42px] leading-[1.05]'>
          <span className='text-[#dce9ff]'>AI investing coach</span>{' '}
          <span className='bg-[linear-gradient(90deg,var(--accent),var(--accent-2))] bg-clip-text text-transparent'>
            with momentum
          </span>
        </h1>
        <p className='mt-3.5 max-w-[680px] text-base text-(--muted)'>
          Read-only portfolio insights. No auto-trading. Minimal, practical
          guidance based on your brokerage data.
        </p>

        <div className='mt-6 flex flex-wrap gap-3'>
          <Link href='/auth/signup' className='no-underline'>
            <span className='inline-block rounded-[10px] border border-[rgba(79,140,255,0.45)] bg-[linear-gradient(135deg,rgba(79,140,255,0.9),rgba(0,215,255,0.75))] px-3.5 py-2.5 font-bold text-[#06101f] shadow-[0_6px_18px_rgba(79,140,255,0.25)]'>
              Get started
            </span>
          </Link>
          <Link href='/auth/login' className='no-underline'>
            <span className='inline-block rounded-[10px] border border-(--border) bg-[rgba(255,255,255,0.03)] px-3.5 py-2.5 font-[650] text-(--text)'>
              Log in
            </span>
          </Link>
        </div>

        <div className='mt-7 rounded-xl border border-(--border) p-4'>
          <div className='font-bold'>Trust microcopy</div>
          <div className='mt-2 text-[13px] text-(--muted)'>
            Read-only brokerage sync. We store your preferences and computed
            risk insights, and we never execute trades.
          </div>
        </div>
      </main>
      <ToastContainer />
    </>
  );
}
