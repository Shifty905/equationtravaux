import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon: LucideIcon;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

const colorVariants = {
  primary: 'bg-equation-navy/10 text-equation-navy border-equation-navy/20',
  secondary: 'bg-equation-gold/10 text-equation-navy border-equation-gold/30',
  success: 'bg-success-50 text-success-700 border-success-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  error: 'bg-error-50 text-error-700 border-error-200'
};

const iconVariants = {
  primary: 'bg-equation-navy text-equation-white',
  secondary: 'bg-equation-gold text-equation-navy',
  success: 'bg-success-100 text-success-600',
  warning: 'bg-warning-100 text-warning-600',
  error: 'bg-error-100 text-error-600'
};

export default function KPICard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'primary' 
}: KPICardProps) {
  return (
    <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-4 sm:p-6 hover:shadow-equation-lg transition-all duration-300 hover:transform hover:scale-105">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-equation-navy mb-2 sm:mb-3 break-words">{value}</p>
          {change && (
            <div className="flex items-center flex-wrap">
              <span className={clsx(
                'text-xs font-semibold px-2 py-1 rounded-full',
                change.type === 'increase' 
                  ? 'text-success-700 bg-success-100' 
                  : 'text-error-700 bg-error-100'
              )}>
                {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
              </span>
              <span className="text-xs text-gray-500 ml-2 hidden sm:inline">vs mois dernier</span>
            </div>
          )}
        </div>
        <div className={clsx(
          'flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl shadow-sm flex-shrink-0 ml-2',
          iconVariants[color]
        )}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
        </div>
      </div>
    </div>
  );
}