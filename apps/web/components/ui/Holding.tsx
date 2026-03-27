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
  currentPrice: number | null;
  estimatedShares: number | null;
};

export function Holding({
  symbol,
  marketValue,
  weight,
  sector,
  unrealizedPnL,
  currentPrice,
  estimatedShares,
}: HoldingProps) {
  const percentChange = Math.abs(
    ((marketValue + unrealizedPnL) / marketValue) * 100 - 100,
  );
  return (
    <article className='rounded-[10px] border border-(--border) bg-[rgba(12,18,31,0.45)] p-3 hover:cursor-pointer hover:bg-blue-500/50 transition-all duration-300'>
      <div className='flex flex-wrap items-baseline justify-between gap-2.5'>
        <div>
          <div className='font-bold self-center'>{symbol}</div>
          {estimatedShares != null ? (
            <div className='text-xs text-(--muted)'>
              {estimatedShares.toFixed(3)} shares
            </div>
          ) : (
            <div className='text-xs text-(--muted)'>Shares unavailable</div>
          )}
        </div>
        <div className='flex flex-col items-end font-bold'>
          <div>{currencyFormatter.format(marketValue)}</div>
          {currentPrice != null ? (
            <div className='text-xs text-(--muted)'>
              Price: {currencyFormatter.format(currentPrice)}
            </div>
          ) : null}
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
