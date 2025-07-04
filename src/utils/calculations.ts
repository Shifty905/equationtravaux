import { Quote, Dashboard } from '../types';

export function calculateCommissions(
  amountHT: number,
  equationRate: number,
  salesRepRate: number
): { equationAmount: number; salesRepAmount: number } {
  const equationAmount = amountHT * (equationRate / 100);
  const salesRepAmount = equationAmount * (salesRepRate / 100);
  
  return { equationAmount, salesRepAmount };
}

export function getDashboardData(quotes: Quote[]): Dashboard {
  const totalHT = quotes.reduce((sum, quote) => sum + quote.amountHT, 0);
  
  const equationCommissionsCollected = quotes
    .filter(quote => quote.status === 'collected')
    .reduce((sum, quote) => sum + quote.equationCommissionAmount, 0);
  
  const salesRepCommissionsPaid = quotes
    .filter(quote => quote.paymentStatus === 'paid')
    .reduce((sum, quote) => sum + quote.salesRepCommissionAmount, 0);
  
  const quotesCount = {
    total: quotes.length,
    billed: quotes.filter(q => q.status === 'billed').length,
    collected: quotes.filter(q => q.status === 'collected').length,
    paid: quotes.filter(q => q.paymentStatus === 'paid').length
  };
  
  const averageQuoteAmount = quotes.length > 0 ? totalHT / quotes.length : 0;
  
  const conversionRates: { [key: string]: number } = {};
  // Simplified conversion rate calculation
  
  return {
    totalHT,
    equationCommissionsCollected,
    salesRepCommissionsPaid,
    quotesCount,
    averageQuoteAmount,
    conversionRates
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR').format(date);
}