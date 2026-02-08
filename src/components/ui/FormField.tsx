import React, { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  tooltip?: string;
  children: ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, tooltip, children }) => (
  <div className="flex flex-col">
    <label className="mb-2 text-sm font-bold text-gray-700 flex items-center">
      {label}
      {tooltip && (
        <div className="relative flex items-center group ml-2">
          <HelpCircle size={16} className="text-gray-400 cursor-help" />
          <div className="absolute bottom-full mb-2 w-64 bg-gray-800 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
            {tooltip}
          </div>
        </div>
      )}
    </label>
    {children}
  </div>
);