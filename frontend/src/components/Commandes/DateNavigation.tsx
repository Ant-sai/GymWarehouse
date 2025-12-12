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
  orders,
}) => {
  const getAvailableDates = (): string[] => {
    const dates = new Set<string>();
    orders.forEach((order) => {
      const date = new Date(order.date).toISOString().split("T")[0];
      dates.add(date);
    });
    return Array.from(dates).sort().reverse();
  };

  const navigateDate = (direction: "prev" | "next") => {
    const currentDate = new Date(selectedDate);
    if (direction === "prev") {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    onDateChange(currentDate.toISOString().split("T")[0]);
  };

  const goToToday = () => {
    onDateChange(new Date().toISOString().split("T")[0]);
  };

  const availableDates = getAvailableDates();

  return (
    <div className="mb-8 bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateDate("prev")}
            className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded flex items-center gap-2"
          >
            ← Jour précédent
          </button>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Sélectionner une date</option>
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => navigateDate("next")}
            className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded flex items-center gap-2"
          >
            Jour suivant →
          </button>
        </div>

        <button
          onClick={goToToday}
          className="bg-[#1E2A47] hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Aujourd'hui
        </button>
      </div>
    </div>
  );
};
