import React from 'react';
import { Link } from 'react-router-dom';
import PrimeroseVector from '../../assets/PrimeroseVector.svg';

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-60 bg-[#1E2A47] text-white p-8">
      <img
        src={PrimeroseVector}
        alt="Gym Warehouse"
        className="w-full h-auto mb-8"
      />
      <nav className="space-y-4 text-sm">
        <Link
          to="/stock"
          className="block text-[#AAB4C3] hover:text-white transition-colors"
        >
          Stock
        </Link>
        <Link
          to="/membres"
          className="block text-[#AAB4C3] hover:text-white transition-colors"
        >
          Membres
        </Link>
        <div className="font-medium text-white">
          Commandes Journalières
        </div>
      </nav>
    </aside>
  );
};
