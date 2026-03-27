const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const pnlColorClass = (unrealizedPnL: number) =>
  unrealizedPnL >= 0 ? 'text-(--success)' : 'text-(--danger)';

const pnlPrefix = (unrealizedPnL: number): string =>
  unrealizedPnL >= 0 ? '+' : '-';
export { currencyFormatter, percentFormatter, pnlColorClass, pnlPrefix };
