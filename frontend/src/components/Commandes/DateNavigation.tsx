// src/components/Commandes/DateNavigation.tsx

import React from 'react';

interface DateNavigationProps {
  selectedDate: string;
  availableDates: string[];
  onDateChange: (date: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onToday: () => void;
}

export const DateNavigation: React.FC<DateNavigationProps> = ({
  selectedDate,
  availableDates,
  onDateChange,
  onNavigate,
  onToday
}) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('prev')}
          className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded flex items-center gap-2 transition-colors"
        >
          ← Jour précédent
        </button>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
          
          <select
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">Sélectionner une date</option>
            {availableDates.map(date => (
              <option key={date} value={date}>
                {formatDate(date)}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onNavigate('next')}
          className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded flex items-center gap-2 transition-colors"
        >
          Jour suivant →
        </button>
      </div>

      <button
        onClick={onToday}
        className="bg-[#1E2A47] hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
      >
        Aujourd'hui
      </button>
    </div>
  );
};