import React, { useEffect, useState } from 'react';
import { Cpu, Database, Shield, Zap, Activity } from 'lucide-react';

export const BootScreen: React.FC<{ message?: string }> = ({ message = "Inicializando Nexus OS" }) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('BIOS Check');

  // Simula o boot sequence visualmente
  useEffect(() => {
    const stages = [
      { name: 'BIOS Security', duration: 300 },
      { name: 'Kernel Load', duration: 500 },
      { name: 'Database Mount', duration: 400 },
      { name: 'UI Drivers', duration: 300 },
    ];

    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 10;
      if (current > 100) current = 100;
      setProgress(current);
      
      const stageIndex = Math.floor((current / 100) * stages.length);
      if (stages[stageIndex]) setStage(stages[stageIndex].name);

      if (current >= 100) clearInterval(interval);
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black opacity-80"></div>
      
      <div className="z-10 w-full max-w-md text-center">
        <div className="mb-8 relative inline-block">
          <div className="absolute -inset-1 bg-blue-500 rounded-full blur opacity-20 animate-pulse"></div>
          <Cpu size={64} className="relative text-blue-400 mx-auto mb-4" />
        </div>

        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent tracking-tight">
          Nexxus OS
        </h1>
        <p className="text-gray-500 text-sm tracking-widest uppercase mb-12">
          Sistema Operacional do Comércio v12.0
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-800 rounded-full h-1.5 mb-4 overflow-hidden border border-gray-700/50">
          <div 
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-400 px-1 font-mono">
          <span className="flex items-center gap-2">
            <Activity size={10} className="text-green-500" />
            {stage}...
          </span>
          <span>{Math.round(progress)}%</span>
        </div>

        {/* Status Message (Real) */}
        <div className="mt-8 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 backdrop-blur-sm">
          <p className="text-xs text-blue-300 animate-pulse">{message}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-gray-600 text-[10px] uppercase tracking-wider">
        Nexxus Technologies &bull; Secure Boot &bull; 2026
      </div>
    </div>
  );
};