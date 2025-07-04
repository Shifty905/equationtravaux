export interface Project {
  id: string;
  name: string;
  address: string;
  salesRepId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quote {
  id: string;
  projectId: string;
  companyName: string;
  amountHT: number;
  status: QuoteStatus;
  billingDate?: Date;
  collectionDate?: Date;
  paymentDate?: Date;
  equationCommissionRate: number;
  salesRepCommissionRate: number;
  equationCommissionAmount: number;
  salesRepCommissionAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesRep {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: Date;
}

export interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
}

export type QuoteStatus = 'billed' | 'collected';
export type PaymentStatus = 'pending' | 'paid';

export interface Dashboard {
  totalHT: number;
  equationCommissionsCollected: number;
  salesRepCommissionsPaid: number;
  quotesCount: {
    total: number;
    billed: number;
    collected: number;
    paid: number;
  };
  averageQuoteAmount: number;
  conversionRates: {
    [salesRepId: string]: number;
  };
}

export interface FilterOptions {
  dateRange: {
    start: Date;
    end: Date;
  };
  salesRepId?: string;
  status?: QuoteStatus;
  companyName?: string;
  paymentStatus?: PaymentStatus;
}