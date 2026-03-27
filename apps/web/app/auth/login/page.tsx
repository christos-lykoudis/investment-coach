'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '../../../lib/api';
import { tokenStore } from '../../../lib/tokens';
import { Field } from '../../../components/ui/Field';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import Link from 'next/link';

const DASHBOARD_REDIRECT_DELAY_MS = 900;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<{ accessToken: string; refreshToken: string }>(
        '/auth/login',
        { email, password },
      );
      if (res.error) throw new Error(res.error.message);
      tokenStore.setAccessToken(res.data.accessToken);
      const meRes = await apiGet<{ onboardingCompleted: boolean }>('/me');
      if (meRes.error) throw new Error(meRes.error.message);
      if (meRes.data.onboardingCompleted) {
        await wait(DASHBOARD_REDIRECT_DELAY_MS);
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='grid gap-4'>
      <Card title='Log in'>
        <div className='grid gap-3'>
          <div className='mb-0.5 text-sm leading-[1.45] text-(--muted)'>
            Welcome back. Sign in to continue your investment plan.
          </div>
          <Field label='Email'>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full rounded-[10px] border border-(--border) px-[13px] py-3 text-sm'
              type='email'
              autoComplete='email'
              placeholder='you@example.com'
            />
          </Field>
          <Field label='Password'>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full rounded-[10px] border border-(--border) px-[13px] py-3 text-sm'
              type='password'
              autoComplete='current-password'
              placeholder='Enter your password'
            />
          </Field>
          {error ? (
            <div className='text-[13px] text-(--danger)'>{error}</div>
          ) : null}
          <div className='mt-1'>
            <Button onClick={submit} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </div>
      </Card>

      <div className='text-center text-sm text-(--muted)'>
        New here? <Link href='/auth/signup'>Create an account</Link>
      </div>
    </div>
  );
}
