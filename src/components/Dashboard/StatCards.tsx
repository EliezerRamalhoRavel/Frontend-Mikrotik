import React from 'react';

interface StatProps {
  label: string;
  count: number;
  type: 'offline' | 'warning' | 'online' | 'paused';
  isActive: boolean;
  onClick: () => void;
}

const colors = {
  offline: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200',
  online: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200',
  paused: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200',
};

const activeRing = {
  offline: 'ring-2 ring-red-500',
  warning: 'ring-2 ring-yellow-500',
  online: 'ring-2 ring-emerald-500',
  paused: 'ring-2 ring-gray-500',
};

export const StatCard: React.FC<StatProps> = ({ label, count, type, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 flex-1 min-w-[140px]
        ${colors[type]}
        ${isActive ? activeRing[type] : ''}
        ${isActive ? 'scale-105 shadow-md' : 'opacity-80 hover:opacity-100'}
      `}
    >
      <span className="text-3xl font-bold">{count}</span>
      <span className="text-xs font-bold uppercase tracking-wide mt-1">{label}</span>
    </button>
  );
};