import React, { ReactElement } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactElement;
  color: string;
  subValue?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subValue }) => (
  <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 flex items-center justify-between hover:shadow-lg transition-shadow duration-300">
    <div>
      <p className="text-sm font-semibold text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
    </div>
    <div className={`p-3 rounded-full ${color}`}>
      {React.cloneElement(icon, { size: 22, className: "text-white" })}
    </div>
  </div>
);