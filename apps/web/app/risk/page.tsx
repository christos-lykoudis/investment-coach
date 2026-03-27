'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/AppShell';
import { RequireAuth } from '../../components/RequireAuth';
import { apiGet } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

type Snapshot = {
  riskSnapshotId: string;
  createdAt: string;
  concentrationScore: number;
  sectorConcentration: number;
  topHoldingWeight: number;
  volatilityEstimate: number;
  drawdownEstimate: number;
  diversificationScore: number;
};

type History = {
  range: string;
  series: Array<{
    createdAt: string;
    concentrationScore: number;
    sectorConcentration: number;
    topHoldingWeight: number;
    volatilityEstimate: number;
    drawdownEstimate: number;
    diversificationScore: number;
  }>;
};

export default function RiskPage() {
  return (
    <RequireAuth>
      <AppShell>
        <RiskDetail />
      </AppShell>
    </RequireAuth>
  );
}

function RiskDetail() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noSnapshot, setNoSnapshot] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [history, setHistory] = useState<History | null>(null);

  const load = async () => {
    setError(null);
    setNoSnapshot(false);
    const [sRes, hRes] = await Promise.all([
      apiGet<Snapshot>('/risk/snapshot'),
      apiGet<History>('/risk/history?range=30d'),
    ]);

    const responses = [sRes, hRes];
    const is404 = (res: (typeof responses)[number]) =>
      Boolean(
        res.error &&
        typeof res.error.details === 'object' &&
        res.error.details &&
        'statusCode' in (res.error.details as Record<string, unknown>) &&
        (res.error.details as { statusCode?: number }).statusCode === 404,
      );

    if (responses.every(is404)) {
      setSnapshot(null);
      setHistory(null);
      setNoSnapshot(true);
      return;
    }

    if (sRes.error) throw new Error(sRes.error.message);
    if (hRes.error) throw new Error(hRes.error.message);
    setSnapshot(sRes.data);
    setHistory(hRes.data);
  };

  useEffect(() => {
    let attempts = 0;
    const run = async () => {
      try {
        attempts += 1;
        await load();
        setLoading(false);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load risk');
        if (attempts < 10) setTimeout(run, 2000);
        else setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      await load();
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to refresh risk');
    } finally {
      setLoading(false);
    }
  };

  const delta = (() => {
    if (!history || history.series.length < 2) return null;
    const first = history.series[0];
    const last = history.series[history.series.length - 1];
    return {
      topHoldingWeight: (last.topHoldingWeight - first.topHoldingWeight) * 100,
      sectorConcentration:
        (last.sectorConcentration - first.sectorConcentration) * 100,
      volatilityEstimate: last.volatilityEstimate - first.volatilityEstimate,
    };
  })();

  const topHoldingPct = snapshot ? snapshot.topHoldingWeight * 100 : null;
  const sectorPct = snapshot ? snapshot.sectorConcentration * 100 : null;
  const volatility = snapshot ? snapshot.volatilityEstimate : null;

  const topHoldingLabel =
    topHoldingPct == null
      ? null
      : topHoldingPct >= 25
        ? 'High concentration'
        : topHoldingPct >= 15
          ? 'Moderate concentration'
          : 'Well diversified';
  const sectorLabel =
    sectorPct == null
      ? null
      : sectorPct >= 40
        ? 'Highly concentrated by sector'
        : sectorPct >= 25
          ? 'Moderately concentrated by sector'
          : 'Balanced sector exposure';
  const volatilityLabel =
    volatility == null
      ? null
      : volatility >= 0.35
        ? 'Higher expected swings'
        : volatility >= 0.2
          ? 'Moderate expected swings'
          : 'Lower expected swings';

  return (
    <div className='grid gap-4'>
      <div className='flex items-center gap-2.5'>
        <Button onClick={refresh} disabled={loading}>
          Refresh
        </Button>
        {loading ? (
          <div className='text-[13px] text-(--muted)'>Loading…</div>
        ) : null}
      </div>

      {error ? <div className='text-(--text)'>{error}</div> : null}
      {noSnapshot ? (
        <Card title='No risk snapshot yet'>
          <div className='text-sm leading-relaxed text-(--muted)'>
            Risk analysis appears after your first successful portfolio sync.
          </div>
          <div className='mt-3'>
            <Link href='/broker/connect' className='no-underline'>
              <Button>Connect brokerage</Button>
            </Link>
          </div>
        </Card>
      ) : null}

      <div className='grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3'>
        <Card title='Top holding weight'>
          {snapshot ? (
            <>
              <div className='text-[22px] font-extrabold'>
                {(snapshot.topHoldingWeight * 100).toFixed(1)}%
              </div>
              <div className='mt-1 text-xs text-(--muted)'>
                {topHoldingLabel}
              </div>
              <div className='mt-2 text-[13px] text-(--muted)'>
                Lower is usually safer because one stock has less control over
                total performance.
              </div>
            </>
          ) : null}
        </Card>
        <Card title='Sector concentration'>
          {snapshot ? (
            <>
              <div className='text-[22px] font-extrabold'>
                {(snapshot.sectorConcentration * 100).toFixed(1)}%
              </div>
              <div className='mt-1 text-xs text-(--muted)'>{sectorLabel}</div>
              <div className='mt-2 text-[13px] text-(--muted)'>
                Higher concentration means one sector can drive most gains and
                losses.
              </div>
            </>
          ) : null}
        </Card>
        <Card title='Volatility estimate'>
          {snapshot ? (
            <>
              <div className='text-[22px] font-extrabold'>
                {snapshot.volatilityEstimate.toFixed(2)}
              </div>
              <div className='mt-1 text-xs text-(--muted)'>
                {volatilityLabel}
              </div>
              <div className='mt-2 text-[13px] text-(--muted)'>
                Higher values mean bigger short-term ups and downs are likely.
              </div>
            </>
          ) : null}
        </Card>
      </div>

      <Card title='What changed (last 30d)'>
        {delta ? (
          <div className='grid gap-2.5 text-(--muted)'>
            <div>
              Top holding weight delta:{' '}
              <b
                className={
                  delta.topHoldingWeight <= 0
                    ? 'text-(--success)'
                    : 'text-(--danger)'
                }
              >
                {delta.topHoldingWeight.toFixed(1)}%
              </b>
            </div>
            <div>
              Sector concentration delta:{' '}
              <b
                className={
                  delta.sectorConcentration <= 0
                    ? 'text-(--success)'
                    : 'text-(--danger)'
                }
              >
                {delta.sectorConcentration.toFixed(1)}%
              </b>
            </div>
            <div>
              Volatility delta:{' '}
              <b
                className={
                  delta.volatilityEstimate <= 0
                    ? 'text-(--success)'
                    : 'text-(--danger)'
                }
              >
                {delta.volatilityEstimate.toFixed(2)}
              </b>
            </div>
          </div>
        ) : (
          <div className='text-[13px] text-(--muted)'>
            Not enough history yet.
          </div>
        )}
      </Card>
    </div>
  );
}
