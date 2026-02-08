// src/components/debug/RenderDebug.tsx
import React, { useEffect, useRef } from 'react';

interface RenderDebugProps {
  name: string;
  children: React.ReactNode;
}

export const RenderDebug: React.FC<RenderDebugProps> = ({ name, children }) => {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current++;
    console.log(`📊 [${name}] Render #${renderCount.current}`);
    
    if (renderCount.current > 3) {
      console.warn(`⚠️ [${name}] Muitos re-renders!`);
    }
    
    return () => {
      console.log(`🧹 [${name}] Cleanup`);
    };
  });

  return <>{children}</>;
};