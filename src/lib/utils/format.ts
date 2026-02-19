/**
 * Format a SOL amount with appropriate precision
 */
export const formatSol = (amount: number, decimals = 2): string => {
  if (amount === 0) return "0 SOL";
  if (amount < 0.01) return `${amount.toFixed(4)} SOL`;
  return `${amount.toFixed(decimals)} SOL`;
};

/**
 * Format a USD amount
 */
export const formatUsd = (amount: number): string => {
  if (amount === 0) return "$0.00";
  if (Math.abs(amount) < 0.01) return `$${amount.toFixed(4)}`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a large number with commas
 */
export const formatNumber = (num: number): string =>
  new Intl.NumberFormat("en-US").format(num);

/**
 * Format a compact number (e.g., 1.2K, 3.5M)
 */
export const formatCompact = (num: number): string =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);

/**
 * Shorten a Solana wallet address for display
 */
export const shortenAddress = (address: string, chars = 4): string => {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

/**
 * Format a timestamp to a human-readable date string
 */
export const formatDate = (timestamp: number): string =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp * 1000));

/**
 * Format a timestamp to a human-readable date+time string
 */
export const formatDateTime = (timestamp: number): string =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp * 1000));

/**
 * Format percentage with sign
 */
export const formatPercent = (value: number, decimals = 1): string => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
};
