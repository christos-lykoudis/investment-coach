'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/AppShell';
import { RequireAuth } from '../../components/RequireAuth';
import { apiGet } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Holding } from '../../components/ui/Holding';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import {
  currencyFormatter,
  percentFormatter,
  pnlColorClass,
} from '../../lib/utils';

type Overview = {
  totalValue: number;
  totalPnL: number;
  cash: number;
  accountCount: number;
  asOf: string;
};

type PositionsResponse = {
  positions: Array<{
    symbol: string;
    weight: number;
    sector: string | null;
    marketValue: number;
    unrealizedPnL: number;
  }>;
};

type RiskSnapshot = {
  riskSnapshotId: string;
  createdAt: string;
  concentrationScore: number;
  sectorConcentration: number;
  topHoldingWeight: number;
  volatilityEstimate: number;
  drawdownEstimate: number;
  diversificationScore: number;
};

type RiskAlertsResponse = {
  riskSnapshotId: string;
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    description: string;
    confidence: number;
  }>;
};

export default function DashboardPage() {
  return (
    <RequireAuth>
      <AppShell>
        <Dashboard />
      </AppShell>
    </RequireAuth>
  );
}

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noSnapshot, setNoSnapshot] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [positions, setPositions] = useState<PositionsResponse | null>(null);
  const [riskSnapshot, setRiskSnapshot] = useState<RiskSnapshot | null>(null);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlertsResponse | null>(null);

  const load = async () => {
    setError(null);
    setNoSnapshot(false);
    const [overview, positions, risk, alerts] = await Promise.all([
      apiGet<Overview>('/portfolio/overview'),
      apiGet<PositionsResponse>('/portfolio/positions'),
      apiGet<RiskSnapshot>('/risk/snapshot'),
      apiGet<RiskAlertsResponse>('/risk/alerts'),
    ]);

    const responses = [overview, positions, risk, alerts];
    const is404 = (response: (typeof responses)[number]) =>
      Boolean(
        response.error &&
        typeof response.error.details === 'object' &&
        response.error.details &&
        'statusCode' in (response.error.details as Record<string, unknown>) &&
        (response.error.details as { statusCode?: number }).statusCode === 404,
      );

    if (responses.every(is404)) {
      setOverview(null);
      setPositions(null);
      setRiskSnapshot(null);
      setRiskAlerts(null);
      setNoSnapshot(true);
      return;
    }

    const firstError = responses.find((response) => response.error);
    if (firstError?.error) throw new Error(firstError.error.message);

    setOverview(overview.data);
    setPositions(positions.data);
    setRiskSnapshot(risk.data);
    setRiskAlerts(alerts.data);
  };

  useEffect(() => {
    let attempts = 0;
    const run = async () => {
      attempts += 1;
      try {
        await load();
        setLoading(false);
      } catch (error: any) {
        setError(error?.message ?? 'Failed to load dashboard');
        if (attempts < 10) {
          setTimeout(run, 2000);
        } else {
          setLoading(false);
        }
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
    } catch (error: any) {
      setError(error?.message ?? 'Failed to refresh');
    } finally {
      setLoading(false);
    }
  };

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
        <Card title='No data yet'>
          <div className='text-sm leading-relaxed text-(--muted)'>
            No portfolio and risk snapshots are available yet. Connect a
            brokerage account and run the first sync.
          </div>
          <div className='mt-3'>
            <Link href='/broker/connect' className='no-underline'>
              <Button>Connect brokerage</Button>
            </Link>
          </div>
        </Card>
      ) : null}

      <div className='grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]'>
        <Card title='Unrealized Value'>
          {overview ? (
            <>
              <div className='text-[26px] font-extrabold'>
                {currencyFormatter.format(overview.totalValue)}
              </div>
              <p className='text-[13px] text-(--muted) uppercase'>
                Unrealized Result
              </p>
              <div className={pnlColorClass(overview.totalPnL)}>
                {percentFormatter.format(
                  overview.totalPnL / overview.totalValue,
                )}
              </div>
            </>
          ) : null}
        </Card>

        <Card title='Top holding weight'>
          {riskSnapshot ? (
            <div className='text-lg font-bold'>
              {(riskSnapshot.topHoldingWeight * 100).toFixed(1)}%
            </div>
          ) : null}
        </Card>
      </div>

      <div className='grid gap-3 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]'>
        <Card title='Top holdings'>
          {positions?.positions?.length ? (
            <div className='grid gap-2.5'>
              {positions.positions.map((position, idx) => (
                <Holding
                  key={`${position.symbol}-${idx}`}
                  symbol={position.symbol}
                  marketValue={position.marketValue}
                  weight={position.weight}
                  sector={position.sector}
                  unrealizedPnL={position.unrealizedPnL}
                />
              ))}
            </div>
          ) : (
            <div className='text-[13px] text-(--muted)'>
              No synced positions yet.
            </div>
          )}
        </Card>

        <Card title='Risk alerts'>
          {riskAlerts?.alerts?.length ? (
            <div className='grid gap-3'>
              {riskAlerts.alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className='rounded-[10px] border border-(--border) p-3'
                >
                  <div className='flex items-center justify-between gap-2.5'>
                    <div className='font-bold'>{alert.title}</div>
                    <span
                      className={`rounded-full border px-2 py-[3px] text-[11px] uppercase tracking-[0.4px] ${
                        alert.severity === 'high'
                          ? 'border-[rgba(244,63,94,0.4)] bg-[rgba(244,63,94,0.16)] text-[#ff9ab0]'
                          : alert.severity === 'medium'
                            ? 'border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.16)] text-[#ffd18a]'
                            : 'border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.16)] text-[#a6f4bf]'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <div className='mt-1.5 text-[13px] text-(--muted)'>
                    {alert.description}
                  </div>
                  <div className='mt-2 text-xs text-(--muted)'>
                    Confidence: {alert.confidence.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-[13px] text-(--muted)'>
              No risk alerts yet.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
