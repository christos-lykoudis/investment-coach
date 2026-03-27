'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/AppShell';
import { RequireAuth } from '../../components/RequireAuth';
import { apiGet, apiPost } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

type FeedItem = {
  id: string;
  kind: string;
  issue: string;
  why: string;
  suggestedNextStep: string;
  confidence: number | null;
  possibleDownside: string | null;
  createdAt: string;
  feedbackType: 'helpful' | 'dismissed' | 'not_relevant' | null;
};

type ActionPlan = {
  title: string;
  steps: string[];
};

type UndoDismissState = {
  recommendationId: string;
  timer: number;
};

export default function CoachPage() {
  return (
    <RequireAuth>
      <AppShell>
        <CoachFeed />
      </AppShell>
    </RequireAuth>
  );
}

function CoachFeed() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [actionPlans, setActionPlans] = useState<Record<string, ActionPlan>>({});
  const [undoDismiss, setUndoDismiss] = useState<UndoDismissState | null>(null);

  const load = async () => {
    setError(null);
    const res = await apiGet<{ feed: FeedItem[] }>('/coach/feed');
    if (res.error) throw new Error(res.error.message);
    setFeed(res.data.feed);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e: any) {
        if (!cancelled) setError(e as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (undoDismiss) {
        window.clearTimeout(undoDismiss.timer);
      }
    };
  }, [undoDismiss]);

  const feedback = async (id: string, feedbackType: string) => {
    const res = await apiPost<{ ok: boolean; actionPlan?: ActionPlan }>(
      `/coach/recommendations/${id}/feedback`,
      {
        feedbackType,
      },
    );
    if (res.error) throw new Error(res.error.message);

    if (feedbackType === 'helpful' && res.data.actionPlan) {
      setFeed((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, feedbackType: 'helpful' } : item,
        ),
      );
      setActionPlans((prev) => ({ ...prev, [id]: res.data.actionPlan as ActionPlan }));
      return;
    }

    if (feedbackType === 'dismissed') {
      if (undoDismiss) {
        window.clearTimeout(undoDismiss.timer);
      }
      const timer = window.setTimeout(() => {
        setUndoDismiss(null);
      }, 8000);
      setUndoDismiss({ recommendationId: id, timer });
      setFeed((prev) => prev.filter((x) => x.id !== id));
      return;
    }

    setActionPlans((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setFeed((prev) => prev.filter((x) => x.id !== id));
  };

  const undoDismissRecommendation = async () => {
    if (!undoDismiss) return;
    const id = undoDismiss.recommendationId;
    window.clearTimeout(undoDismiss.timer);
    setUndoDismiss(null);
    const res = await apiPost<{ ok: boolean; recommendation?: FeedItem | null }>(
      `/coach/recommendations/${id}/undo-dismiss`,
      {},
    );
    if (res.error) throw new Error(res.error.message);
    if (res.data.recommendation) {
      setFeed((prev) => [res.data.recommendation as FeedItem, ...prev]);
    }
  };

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='text-[13px] text-(--muted)'>
          Educational coaching only. No auto-trading.
        </div>
        <Link href='/coach/disliked' className='text-[13px] text-[#cfe2ff] underline'>
          View disliked nudges
        </Link>
      </div>
      {error ? (
        <div className='text-(--text)'>{error.message}</div>
      ) : null}
      {undoDismiss ? (
        <div className='flex flex-wrap items-center gap-2 rounded-[10px] border border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.12)] p-3 text-[13px] text-[#ffd18a]'>
          Nudge dismissed.
          <button
            className='cursor-pointer font-semibold underline'
            onClick={() => void undoDismissRecommendation()}
          >
            Undo
          </button>
        </div>
      ) : null}
      {loading ? <div className='text-(--muted)'>Loading…</div> : null}
      <div className='grid gap-3'>
        {feed.map((item) => (
          <Card
            key={item.id}
            title={
              item.kind === 'behavior_pattern' ? 'Behavior nudge' : 'Risk nudge'
            }
          >
            <div className='grid gap-2.5'>
              <div>
                <div className='flex flex-wrap items-start justify-between gap-2'>
                  <div className='font-bold'>{item.issue}</div>
                  {item.feedbackType === 'helpful' ? (
                    <div className='rounded-full border border-[rgba(250,204,21,0.45)] bg-[rgba(250,204,21,0.18)] px-2 py-[2px] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#fde68a]'>
                      ★ Helpful
                    </div>
                  ) : null}
                </div>
                <div className='mt-1.5 text-[13px] text-(--muted)'>
                  {item.why}
                </div>
              </div>
              <div className='text-[13px] text-(--muted)'>
                Suggested next step:{' '}
                <span className='text-(--text)'>
                  {item.suggestedNextStep}
                </span>
              </div>
              <div className='flex flex-wrap gap-2.5'>
                {typeof item.confidence === 'number' ? (
                  <div
                    className={`text-xs font-bold ${
                      item.confidence >= 0.75
                        ? 'text-(--success)'
                        : item.confidence <= 0.45
                          ? 'text-(--warning)'
                          : 'text-[#9fd0ff]'
                    }`}
                  >
                    Confidence: {item.confidence.toFixed(2)}
                  </div>
                ) : null}
              </div>
              {item.possibleDownside ? (
                <div className='text-[13px] text-(--muted)'>
                  Possible downside: {item.possibleDownside}
                </div>
              ) : null}
              <div className='mt-1.5 flex flex-wrap gap-2.5'>
                <Button onClick={() => feedback(item.id, 'helpful')}>
                  Helpful
                </Button>
                <Button onClick={() => feedback(item.id, 'not_relevant')}>
                  Not relevant
                </Button>
                <Button onClick={() => feedback(item.id, 'dismissed')}>
                  Dismiss
                </Button>
              </div>
              {actionPlans[item.id] ? (
                <div className='mt-2 rounded-[10px] border border-[rgba(79,140,255,0.35)] bg-[rgba(79,140,255,0.1)] p-3'>
                  <div className='text-sm font-bold text-[#cfe2ff]'>
                    {actionPlans[item.id].title}
                  </div>
                  <div className='mt-2 grid gap-1.5 text-[13px] text-(--text)'>
                    {actionPlans[item.id].steps.map((step, index) => (
                      <div key={`${item.id}-step-${index}`}>- {step}</div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
