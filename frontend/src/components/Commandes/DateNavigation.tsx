import React from 'react';
import type { Order } from '../../Commandes';

interface DateNavigationProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  orders: Order[];
}

export const DateNavigation: React.FC<DateNavigationProps> = ({
  selectedDate,
  onDateChange,
}) => {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="relative">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    </div>
  );
};
