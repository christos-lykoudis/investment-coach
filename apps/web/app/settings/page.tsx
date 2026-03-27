'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { RequireAuth } from '../../components/RequireAuth';
import { apiDelete, apiGet } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Link from 'next/link';
import { toast } from 'react-toastify';
import ConnectBrokerPage from '../broker/connect/page';

type Connection = {
  id: string;
  provider: string;
  status: string;
  lastSyncedAt: string | null;
};

export default function SettingsPage() {
  return (
    <RequireAuth>
      <AppShell>
        <Settings />
      </AppShell>
    </RequireAuth>
  );
}

function Settings() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await apiGet<{ connections: Connection[] }>(
      '/broker/connections',
    );
    if (res.error) throw new Error(res.error.message);
    setConnections(res.data.connections);
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disconnect = async (id: string) => {
    const res = await apiDelete(`/broker/connections/${id}`);
    if (res.error) throw new Error(res.error.message);
    toast.success('Broker account disconnected successfully');
    await load();
  };

  return (
    <div className='grid gap-4'>
      <Card title='Broker connections'>
        {error ? <div className='text-(--text)'>{error}</div> : null}
        {loading ? (
          <div className='text-sm text-(--muted)'>Loading…</div>
        ) : null}
        {!loading && !connections.length ? (
          <div className='flex flex-col gap-2 text-sm text-(--muted)'>
            No broker connected.
            <Link href='/broker/connect' className='no-underline'>
              <Button>Connect brokerage</Button>
            </Link>
          </div>
        ) : null}
        <div className='grid gap-3 mt-2'>
          {connections.map((connection) => (
            <div
              key={connection.id}
              className='flex justify-between gap-3 items-center flex-wrap'
            >
              <div>
                <div className='font-bold'>
                  {connection.provider} ({connection.status})
                </div>
                <div className='text-xs text-(--muted)'>
                  Last sync:{' '}
                  {connection.lastSyncedAt
                    ? new Date(connection.lastSyncedAt).toLocaleString()
                    : '—'}
                </div>
              </div>
              <div>
                <Button onClick={() => disconnect(connection.id)}>
                  Disconnect
                </Button>
              </div>
              {/* <div>
                <Button onclick={() => remove(connection.id)}>
                  Remove
                </Button>
              </div> */}
            </div>
          ))}
        </div>
      </Card>

      <Card title='Risk profile'>
        <div className='text-sm text-(--muted) mb-3'>
          Edit preferences from onboarding.
        </div>
        <Link href='/onboarding' className='w-full'>
          <Button>Go to onboarding</Button>
        </Link>
      </Card>
    </div>
  );
}
