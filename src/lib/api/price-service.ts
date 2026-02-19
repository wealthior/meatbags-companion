import type { SolPrice, PriceHistory, PriceRange, HistoricalPrice } from "@/types/price";
import type { ApiResult } from "@/types/api";
import { ok, err } from "@/types/api";
import { COINGECKO_API_URL } from "@/lib/utils/constants";

const RANGE_TO_DAYS: Record<PriceRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
  all: 1825,
};

/**
 * Fetch current SOL price in USD from CoinGecko
 */
export const fetchCurrentSolPrice = async (): Promise<ApiResult<SolPrice>> => {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=solana&vs_currencies=usd&include_last_updated_at=true`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      return err("PRICE_FEED_UNAVAILABLE", `CoinGecko error: ${response.status}`, true);
    }

    const data = await response.json();
    return ok({
      usd: data.solana.usd,
      lastUpdated: data.solana.last_updated_at,
    });
  } catch (error) {
    return err(
      "PRICE_FEED_UNAVAILABLE",
      error instanceof Error ? error.message : "Price feed unavailable",
      true
    );
  }
};

/**
 * Fetch historical SOL prices from CoinGecko
 */
export const fetchHistoricalPrices = async (
  range: PriceRange
): Promise<ApiResult<PriceHistory>> => {
  try {
    const days = RANGE_TO_DAYS[range];
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/solana/market_chart?vs_currency=usd&days=${days}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      return err("PRICE_FEED_UNAVAILABLE", `CoinGecko error: ${response.status}`, true);
    }

    const data = await response.json();
    const prices: HistoricalPrice[] = (data.prices as [number, number][]).map(
      ([timestamp, usd]) => ({
        timestamp: Math.floor(timestamp / 1000),
        usd,
      })
    );

    return ok({ prices, range });
  } catch (error) {
    return err(
      "PRICE_FEED_UNAVAILABLE",
      error instanceof Error ? error.message : "Historical prices unavailable",
      true
    );
  }
};

/**
 * Get approximate SOL price at a specific timestamp.
 * Uses CoinGecko historical data with nearest-match interpolation.
 */
export const getSolPriceAtTimestamp = async (
  timestamp: number
): Promise<ApiResult<number>> => {
  try {
    const date = new Date(timestamp * 1000);
    const dateStr = `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;

    const response = await fetch(
      `${COINGECKO_API_URL}/coins/solana/history?date=${dateStr}&localization=false`
    );

    if (!response.ok) {
      return err("PRICE_FEED_UNAVAILABLE", `CoinGecko error: ${response.status}`, true);
    }

    const data = await response.json();
    const price = data?.market_data?.current_price?.usd ?? 0;

    return ok(price);
  } catch (error) {
    return err(
      "PRICE_FEED_UNAVAILABLE",
      error instanceof Error ? error.message : "Price at timestamp unavailable",
      true
    );
  }
};
