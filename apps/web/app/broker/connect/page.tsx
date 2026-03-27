'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/AppShell';
import { RequireAuth } from '../../../components/RequireAuth';
import { apiPost } from '../../../lib/api';
import { apiGet } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

const DASHBOARD_REDIRECT_DELAY_MS = 900;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ConnectBrokerPage() {
  return (
    <RequireAuth>
      <AppShell>
        <ConnectBroker />
      </AppShell>
    </RequireAuth>
  );
}

function ConnectBroker() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Array<{ id: string; label: string }>>([]);
  const [provider, setProvider] = useState('snaptrade');
  const [session, setSession] = useState<null | {
    id: string;
    redirectUrl: string;
    providerToken: string;
  }>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<{ providers: Array<{ id: string; label: string }> }>('/broker/connect/providers');
        if (res.error) throw new Error(res.error.message);
        setProviders(res.data.providers);
      } catch {
        setProviders([
          { id: 'snaptrade', label: 'Snaptrade' },
          { id: 'fidelity', label: 'Fidelity' },
          { id: 'schwab', label: 'Schwab' },
          { id: 'robinhood', label: 'Robinhood' },
          { id: 'trading212', label: 'Trading 212' },
        ]);
      }
    })();
  }, []);

  const start = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<{
        redirectUrl: string;
        providerToken: string;
        id: string;
      }>('/broker/connect/session', { provider });
      if (res.error) throw new Error(res.error.message);
      setSession(res.data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create connect session');
    } finally {
      setLoading(false);
    }
  };

  const complete = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<{ brokerConnectionId: string }>(
        '/broker/connect/callback',
        {
          sessionId: session.id,
          providerToken: session.providerToken,
        },
      );
      if (res.error) throw new Error(res.error.message);
      router.replace('/dashboard');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to finalize connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='grid gap-4'>
      <Card title='Connect brokerage'>
        <div className='mb-3.5 text-(--muted)'>
          Read-only brokerage sync. No auto-trading.
        </div>
        <div className='grid gap-3'>
          {!session ? (
            <label className='grid gap-1'>
              <span className='text-[13px] text-(--muted)'>Brokerage provider</span>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className='w-full rounded-[10px] border border-(--border) px-[13px] py-3 text-sm'
              >
                {(providers.length
                  ? providers
                  : [{ id: 'snaptrade', label: 'Snaptrade' }]).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {!session ? (
            <Button onClick={start} disabled={loading}>
              {loading ? 'Preparing session...' : `Connect ${provider.charAt(0).toUpperCase()}${provider.slice(1)}`}
            </Button>
          ) : null}

          {session ? (
            <>
              <div className='text-sm text-(--muted)'>
                Session created.
              </div>
              <div className='wrap-break-word text-[13px] text-(--muted)'>
                {session.redirectUrl}
              </div>
              <Button onClick={complete} disabled={loading}>
                {loading ? 'Finalizing...' : 'Complete connection'}
              </Button>
            </>
          ) : null}

          {error ? <div className='text-(--text)'>{error}</div> : null}
        </div>
      </Card>

      <div className='text-[13px] text-(--muted)'>
        After connecting, the app will sync portfolio data in the background.
      </div>
    </div>
  );
}
