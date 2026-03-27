import { Injectable, Logger } from '@nestjs/common';
import { env } from '../config/env';

type CachedQuote = {
  price: number;
  fetchedAtMs: number;
};

const ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';
//cache for 1 hour to avoid rate limiting
const QUOTE_CACHE_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private readonly quoteCache = new Map<string, CachedQuote>();

  async getLatestPrices(symbols: string[]): Promise<Record<string, number>> {
    const apiKey = env.alphaVantageApiKey;
    if (!apiKey) return {};

    const uniqueSymbols = [
      ...new Set(symbols.map((s) => s.trim().toUpperCase())),
    ].filter(Boolean);
    if (uniqueSymbols.length === 0) return {};

    const now = Date.now();
    const prices: Record<string, number> = {};
    const symbolsToFetch: string[] = [];

    for (const symbol of uniqueSymbols) {
      const cached = this.quoteCache.get(symbol);
      if (cached && now - cached.fetchedAtMs < QUOTE_CACHE_TTL_MS) {
        prices[symbol] = cached.price;
      } else {
        symbolsToFetch.push(symbol);
      }
    }

    for (const symbol of symbolsToFetch) {
      const quote = await this.fetchGlobalQuote(symbol, apiKey);
      console.log('quote', quote);
      if (quote != null) {
        this.quoteCache.set(symbol, {
          price: quote.price,
          fetchedAtMs: Date.now(),
        });
        prices[symbol] = quote.price;
      }
    }

    return prices;
  }

  private async fetchGlobalQuote(
    symbol: string,
    apiKey: string,
  ): Promise<{ price: number; changePercent: number } | null> {
    const url = `${ALPHA_VANTAGE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.log('res not ok');
        return null;
      }
      const body = (await res.json()) as
        | {
            'Global Quote'?: {
              '05. price'?: string;
              '10. change percent'?: string;
            };
            Note?: string;
            Information?: string;
          }
        | undefined;

      if (!body) return null;

      if (body.Note || body.Information) {
        this.logger.warn(
          `Alpha Vantage limited quote requests; missing price for ${symbol}`,
        );
        return null;
      }

      const rawPrice = body['Global Quote']?.['05. price'];
      const changePercent = body['Global Quote']?.['10. change percent'];
      if (!rawPrice) return null;
      if (!changePercent) return null;

      const parsedPrice = Number(rawPrice);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) return null;
      const parsedChangePercent = Number(changePercent);
      if (!Number.isFinite(parsedChangePercent)) return null;
      return { price: parsedPrice, changePercent: parsedChangePercent };
    } catch (error) {
      this.logger.warn(`Failed fetching quote for ${symbol}`);
      return null;
    }
  }
}
