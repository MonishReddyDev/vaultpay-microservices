/**
 * Formats a number to a localized currency string.
 * This ensures we never perform raw floating point math for UI display
 * and hands off formatting safely to the browser's native Intl API.
 */
export const formatCurrency = (amount, currency = 'USD') => {
  const numberAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numberAmount)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberAmount);
};
