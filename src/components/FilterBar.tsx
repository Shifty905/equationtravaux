import React from 'react';
import { Search, Calendar, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface FilterBarProps {
  onSearch?: (query: string) => void;
  onSalesRepFilter?: (salesRepId: string) => void;
  onDateRangeFilter?: (startDate: string, endDate: string) => void;
  placeholder?: string;
  searchValue?: string;
  selectedSalesRepId?: string;
  startDate?: string;
  endDate?: string;
  showSalesRepFilter?: boolean;
  showDateFilter?: boolean;
}

export default function FilterBar({ 
  onSearch, 
  onSalesRepFilter,
  onDateRangeFilter,
  placeholder = "Rechercher...",
  searchValue = '',
  selectedSalesRepId = '',
  startDate = '',
  endDate = '',
  showSalesRepFilter = true,
  showDateFilter = true
}: FilterBarProps) {
  const { state } = useApp();

  return (
    <div className="bg-equation-white rounded-2xl shadow-equation border border-gray-100 p-4 sm:p-6 mb-6">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200 bg-gray-50 focus:bg-equation-white text-sm sm:text-base"
          />
        </div>

        {/* Filters Row */}
        {(showDateFilter || showSalesRepFilter) && (
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Date Range */}
            {showDateFilter && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 flex-1">
                <Calendar className="h-5 w-5 text-equation-navy flex-shrink-0" />
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onDateRangeFilter?.(e.target.value, endDate)}
                    className="border border-gray-200 rounded-lg px-2 sm:px-3 py-2 focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200 text-xs sm:text-sm flex-1 min-w-0"
                  />
                  <span className="text-gray-500 font-medium text-xs sm:text-sm">à</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onDateRangeFilter?.(startDate, e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 sm:px-3 py-2 focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200 text-xs sm:text-sm flex-1 min-w-0"
                  />
                </div>
              </div>
            )}

            {/* Sales Rep Filter */}
            {showSalesRepFilter && (
              <select 
                value={selectedSalesRepId}
                onChange={(e) => onSalesRepFilter?.(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 sm:px-4 py-3 focus:ring-2 focus:ring-equation-gold focus:border-equation-gold transition-all duration-200 bg-gray-50 focus:bg-equation-white text-sm sm:text-base min-w-0 sm:min-w-[200px]"
              >
                <option value="">Tous les CA</option>
                {state.salesReps.map(rep => (
                  <option key={rep.id} value={rep.id}>{rep.name}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
    </div>
  );
}