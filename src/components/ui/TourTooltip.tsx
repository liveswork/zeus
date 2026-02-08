// src/components/ui/TourTooltip.tsx

import React from 'react';
import { TooltipRenderProps } from 'react-joyride';
import { GourmetAImascot } from './GourmetAImascot';

export const TourTooltip: React.FC<TooltipRenderProps> = ({
  step,
  index,
  size,
  isLastStep,
  tooltipProps,
  primaryProps,
  backProps,
  skipProps,
}) => {
  return (
    <div
      {...tooltipProps}
      className="bg-slate-800/80 backdrop-blur-sm text-white rounded-2xl shadow-2xl p-6 max-w-sm border border-slate-700"
    >
      <div className="flex gap-4">
        <div>
          <GourmetAImascot />
        </div>
        <div className="flex-1">
          {step.title && <h3 className="text-xl font-bold mb-2">{step.title}</h3>}
          <div className="text-slate-300 text-sm leading-relaxed">{step.content}</div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700">
        <button {...skipProps} className="text-xs text-slate-400 hover:text-white">
          Pular Guia
        </button>
        
        <div className="flex items-center gap-3">
          {index > 0 && (
            <button {...backProps} className="font-bold text-sm py-2 px-4 hover:bg-slate-700 rounded-lg">
              Voltar
            </button>
          )}
          <button {...primaryProps} className="font-bold text-sm py-2 px-5 bg-blue-600 hover:bg-blue-700 rounded-lg">
            {isLastStep ? 'Finalizar' : 'Avançar'}
          </button>
        </div>
      </div>
    </div>
  );
};