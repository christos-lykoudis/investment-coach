'use client';

import React from 'react';
import {
  currencyFormatter,
  percentFormatter,
  pnlColorClass,
  pnlPrefix,
} from '../../lib/utils';

export type HoldingProps = {
  symbol: string;
  marketValue: number;
  weight: number;
  sector: string | null;
  unrealizedPnL: number;
};

export function Holding({
  symbol,
  marketValue,
  weight,
  sector,
  unrealizedPnL,
}: HoldingProps) {
  const percentChange = Math.abs(
    ((marketValue + unrealizedPnL) / marketValue) * 100 - 100,
  );
  return (
    <article className='rounded-[10px] border border-(--border) bg-[rgba(12,18,31,0.45)] p-3'>
      <div className='flex flex-wrap items-baseline justify-between gap-2.5'>
        <div className='font-bold'>{symbol}</div>
        <div className='flex flex-col items-end font-bold'>
          <div>{currencyFormatter.format(marketValue)}</div>
          <div className={`flex flex-col ${pnlColorClass(unrealizedPnL)}`}>
            {pnlPrefix(unrealizedPnL).toString()}
            {currencyFormatter.format(Math.abs(unrealizedPnL))} (
            {percentChange.toFixed(2)}%)
          </div>
        </div>
      </div>
    </article>
  );
}
