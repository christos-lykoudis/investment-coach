'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/AppShell';
import { RequireAuth } from '../../components/RequireAuth';
import { apiGet, apiPut } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';

type MeResponse = {
  id: string;
  email: string;
  onboardingCompleted: boolean;
  preferences: null | {
    timeHorizon: string;
    riskTolerance: string;
    volatilityComfort: string;
    goalType: string;
    experienceLevel: string;
  };
};

export default function OnboardingPage() {
  return (
    <RequireAuth>
      <AppShell>
        <OnboardingForm />
      </AppShell>
    </RequireAuth>
  );
}

function OnboardingForm() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState({
    timeHorizon: '5_10_years',
    riskTolerance: 'moderate',
    volatilityComfort: 'medium',
    goalType: 'wealth_growth',
    experienceLevel: 'intermediate',
  });

  useEffect(() => {
    (async () => {
      setError(null);
      try {
        const res = await apiGet<MeResponse>('/me');
        if (res.error) throw new Error(res.error.message);
        setMe(res.data);
        if (res.data.preferences) {
          setPrefs(res.data.preferences);
        }
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submit = async () => {
    setError(null);
    try {
      const res = await apiPut<any>('/me/preferences', prefs);
      if (res.error) throw new Error(res.error.message);
      router.replace('/broker/connect');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save preferences');
    }
  };

  if (loading) return <div className='text-(--muted)'>Loading…</div>;

  return (
    <div className='grid gap-4'>
      <Card title='Onboarding preferences'>
        <div className='grid gap-3.5'>
          {error ? (
            <div className='text-[13px] text-(--danger)'>{error}</div>
          ) : null}

          <Field label='Time horizon'>
            <select
              value={prefs.timeHorizon}
              onChange={(e) =>
                setPrefs({ ...prefs, timeHorizon: e.target.value })
              }
              className='w-full rounded-[10px] border border-(--border) px-[13px] py-3 text-sm'
            >
              <option value='1_3_years'>1-3 years</option>
              <option value='3_5_years'>3-5 years</option>
              <option value='5_10_years'>5-10 years</option>
              <option value='10_plus_years'>10+ years</option>
            </select>
          </Field>

          <Field label='Risk tolerance'>
            <select
              value={prefs.riskTolerance}
              onChange={(e) =>
                setPrefs({ ...prefs, riskTolerance: e.target.value })
              }
              className='w-full rounded-[10px] border border-(--border) px-[13px] py-3 text-sm'
            >
              <option value='conservative'>Conservative</option>
              <option value='moderate'>Moderate</option>
              <option value='aggressive'>Aggressive</option>
            </select>
          </Field>

          <Field label='Volatility comfort'>
            <select
              value={prefs.volatilityComfort}
              onChange={(e) =>
                setPrefs({ ...prefs, volatilityComfort: e.target.value })
              }
              className='w-full rounded-[10px] border border-(--border) px-[13px] py-3 text-sm'
            >
              <option value='low'>Low</option>
              <option value='medium'>Medium</option>
              <option value='high'>High</option>
            </select>
          </Field>

          <Field label='Goal'>
            <select
              value={prefs.goalType}
              onChange={(e) => setPrefs({ ...prefs, goalType: e.target.value })}
              className='w-full rounded-[10px] border border-(--border) px-[13px] py-3 text-sm'
            >
              <option value='wealth_growth'>Wealth growth</option>
              <option value='income'>Income</option>
              <option value='preservation'>Preservation</option>
            </select>
          </Field>

          <Field label='Experience level'>
            <select
              value={prefs.experienceLevel}
              onChange={(e) =>
                setPrefs({ ...prefs, experienceLevel: e.target.value })
              }
              className='w-full rounded-[10px] border border-(--border) px-[13px] py-3 text-sm'
            >
              <option value='beginner'>Beginner</option>
              <option value='intermediate'>Intermediate</option>
              <option value='advanced'>Advanced</option>
            </select>
          </Field>

          <Button type='button' onClick={submit as any}>
            Save and continue
          </Button>
        </div>
      </Card>

      {me ? (
        <div className='text-sm text-(--muted)'>
          Your profile: {me.preferences ? 'Configured' : 'Draft'} (editable
          later)
        </div>
      ) : null}
    </div>
  );
}
