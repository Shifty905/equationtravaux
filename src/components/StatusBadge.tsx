import React from 'react';
import { QuoteStatus, PaymentStatus } from '../types';
import clsx from 'clsx';

interface StatusBadgeProps {
  status: QuoteStatus | PaymentStatus;
  type?: 'quote' | 'payment';
}

const quoteStatusConfig = {
  billed: { label: 'Facturé', color: 'bg-equation-gold/20 text-equation-navy border-equation-gold/40' },
  collected: { label: 'Encaissé', color: 'bg-success-100 text-success-700 border-success-200' }
};

const paymentStatusConfig = {
  pending: { label: 'À payer', color: 'bg-warning-100 text-warning-700 border-warning-200' },
  paid: { label: 'Payé', color: 'bg-success-100 text-success-700 border-success-200' }
};

export default function StatusBadge({ status, type = 'quote' }: StatusBadgeProps) {
  const config = type === 'quote' ? quoteStatusConfig : paymentStatusConfig;
  const statusInfo = config[status as keyof typeof config];

  if (!statusInfo) return null;

  return (
    <span className={clsx(
      'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
      statusInfo.color
    )}>
      {statusInfo.label}
    </span>
  );
}