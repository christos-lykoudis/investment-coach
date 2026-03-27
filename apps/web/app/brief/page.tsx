"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { RequireAuth } from "../../components/RequireAuth";
import { apiGet, apiPost } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

type Brief = {
  id: string;
  generatedAt: string;
  summary: string;
  topChanges: string[];
  risksToWatch: string[];
  recommendedActions: Array<{
    action: string;
    why: string;
    confidence: number;
    possibleDownside: string;
  }>;
};

export default function BriefPage() {
  return (
    <RequireAuth>
      <AppShell>
        <BriefView />
      </AppShell>
    </RequireAuth>
  );
}

function BriefView() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await apiGet<Brief>("/coach/brief/latest");
    if (res.error) throw new Error(res.error.message);
    setBrief(res.data as any);
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e: any) {
        setError(e?.message ?? null);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiPost<Brief>("/coach/brief/generate", {});
      if (res.error) throw new Error(res.error.message);
      setBrief(res.data as any);
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate brief");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className='text-(--muted)'>Loading…</div>;

  return (
    <div className='grid gap-4'>
      {error ? <div className='text-(--text)'>{error}</div> : null}
      <Card title="Weekly brief">
        {!brief ? (
          <div className='text-[13px] text-(--muted)'>
            No brief generated yet. Generate one for MVP testing.
            <div className='mt-3.5'>
              <Button onClick={generate} disabled={busy}>
                {busy ? "Generating..." : "Generate weekly brief"}
              </Button>
            </div>
          </div>
        ) : (
          <div className='grid gap-3.5'>
            <div className='text-[13px] text-(--muted)'>
              Generated: {new Date(brief.generatedAt).toLocaleString()}
            </div>
            <div className='text-base font-extrabold'>Summary</div>
            <div className='text-(--text)'>{brief.summary}</div>

            <div className='grid gap-2'>
              <div className='text-sm font-extrabold'>Top changes</div>
              {brief.topChanges?.length ? (
                <div className='grid gap-1.5 text-[13px] text-(--muted)'>
                  {brief.topChanges.map((c, idx) => (
                    <div key={`${c}-${idx}`}>- {c}</div>
                  ))}
                </div>
              ) : (
                <div className='text-[13px] text-(--muted)'>No changes recorded.</div>
              )}
            </div>

            <div className='grid gap-2'>
              <div className='text-sm font-extrabold'>Risks to watch</div>
              <div className='grid gap-1.5 text-[13px] text-(--muted)'>
                {brief.risksToWatch?.map((r, idx) => (
                  <div key={`${r}-${idx}`}>- {r}</div>
                ))}
              </div>
            </div>

            <div className='grid gap-2'>
              <div className='text-sm font-extrabold'>Recommended actions</div>
              {brief.recommendedActions?.slice(0, 3).map((a, idx) => {
                const confidenceColor =
                  a.confidence >= 0.75
                    ? 'text-(--success)'
                    : a.confidence <= 0.45
                      ? 'text-(--warning)'
                      : 'text-[#9fd0ff]';
                return (
                <div key={`${a.action}-${idx}`} className='rounded-[10px] border border-(--border) p-3'>
                  <div className='font-bold'>{a.action}</div>
                  <div className='mt-1.5 text-[13px] text-(--muted)'>{a.why}</div>
                  <div className='mt-2 text-xs text-(--muted)'>
                    Confidence:{" "}
                    <span className={`font-bold ${confidenceColor}`}>
                      {a.confidence.toFixed(2)}
                    </span>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

