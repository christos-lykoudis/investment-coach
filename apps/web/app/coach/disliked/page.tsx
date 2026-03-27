'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/AppShell';
import { RequireAuth } from '../../../components/RequireAuth';
import { apiGet } from '../../../lib/api';
import { Card } from '../../../components/ui/Card';

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

export default function DislikedCoachPage() {
  return (
    <RequireAuth>
      <AppShell>
        <DislikedFeed />
      </AppShell>
    </RequireAuth>
  );
}

function DislikedFeed() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<{ feed: FeedItem[] }>('/coach/disliked');
        if (res.error) throw new Error(res.error.message);
        setFeed(res.data.feed);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load disliked nudges');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='text-sm font-semibold text-[#ffd2d2]'>Disliked nudges</div>
        <Link href='/coach' className='text-[13px] text-[#cfe2ff] underline'>
          Back to coach
        </Link>
      </div>

      {error ? <div className='text-(--text)'>{error}</div> : null}
      {loading ? <div className='text-(--muted)'>Loading…</div> : null}
      {!loading && !feed.length ? (
        <div className='text-[13px] text-(--muted)'>
          No disliked nudges yet.
        </div>
      ) : null}

      <div className='grid gap-3'>
        {feed.map((item) => (
          <Card
            key={item.id}
            title={item.kind === 'behavior_pattern' ? 'Behavior nudge' : 'Risk nudge'}
          >
            <div className='grid gap-2.5'>
              <div className='flex flex-wrap items-start justify-between gap-2'>
                <div className='font-bold'>{item.issue}</div>
                <div className='rounded-full border border-[rgba(244,63,94,0.45)] bg-[rgba(244,63,94,0.2)] px-2 py-[2px] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#ffb1c0]'>
                  ⚑ Not relevant
                </div>
              </div>
              <div className='text-[13px] text-(--muted)'>{item.why}</div>
              <div className='text-[13px] text-(--muted)'>
                Suggested next step:{' '}
                <span className='text-(--text)'>{item.suggestedNextStep}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
