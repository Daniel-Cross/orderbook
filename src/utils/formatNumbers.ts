/**
 * Format numbers for display in the orderbook
 * Makes large numbers easier to read with proper formatting
 */

/**
 * Format a price with appropriate decimal places and thousands separators
 */
export const formatPrice = (price: number): string => {
  // For prices, use 2 decimal places and add thousands separators
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(price);
};

/**
 * Format a size/quantity with appropriate decimal places
 * Uses fewer decimals for larger numbers
 */
export const formatSize = (size: number): string => {
  if (size === 0) return "0";
  
  // For very large numbers, use fewer decimals
  if (size >= 1000) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(size);
  }
  
  // For medium numbers, use 2-4 decimals
  if (size >= 1) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
      useGrouping: true,
    }).format(size);
  }
  
  // For small numbers, use up to 8 decimals but remove trailing zeros
  const formatted = size.toFixed(8);
  return formatted.replace(/\.?0+$/, "");
};

/**
 * Format cumulative total with thousands separators
 */
export const formatTotal = (total: number): string => {
  if (total === 0) return "0";
  
  // For totals, use fewer decimals for readability
  if (total >= 1000) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(total);
  }
  
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
    useGrouping: true,
  }).format(total);
};

/**
 * Format spread percentage
 */
export const formatSpreadPercent = (percent: number): string => {
  return `${percent.toFixed(4)}%`;
};

