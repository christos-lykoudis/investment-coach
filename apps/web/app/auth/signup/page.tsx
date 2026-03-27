'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '../../../lib/api';
import { tokenStore } from '../../../lib/tokens';
import { Field } from '../../../components/ui/Field';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import Link from 'next/link';

export default function SignupPage() {
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
        '/auth/signup',
        { email, password },
      );
      if (res.error) throw new Error(res.error.message);
      tokenStore.setAccessToken(res.data.accessToken);
      router.replace('/onboarding');
    } catch (e: any) {
      setError(e?.message ?? 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='grid gap-4'>
      <Card title='Sign up'>
        <div className='grid gap-3'>
          <div className='mb-0.5 text-sm leading-[1.45] text-(--muted)'>
            Create your account to start onboarding and set preferences.
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
              autoComplete='new-password'
              placeholder='Create a password'
            />
          </Field>
          {error ? (
            <div className='text-[13px] text-(--danger)'>{error}</div>
          ) : null}
          <div className='mt-1'>
            <Button onClick={submit} disabled={loading}>
              {loading ? 'Creating...' : 'Create account'}
            </Button>
          </div>
        </div>
      </Card>
      <div className='text-center text-sm text-(--muted)'>
        Already have an account? <Link href='/auth/login'>Log in</Link>
      </div>
    </div>
  );
}
