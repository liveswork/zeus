import React, { useEffect, useRef } from 'react';

interface RenderTrackerProps {
  name: string;
  children: React.ReactNode;
}

export const RenderTracker: React.FC<RenderTrackerProps> = ({ name, children }) => {
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current++;
    console.log(`📊 [${name}] Render #${renderCount.current}`);
    
    if (renderCount.current > 2) {
      console.warn(`⚠️ [${name}] Múltiplos re-renders detectados!`);
      console.trace('Stack trace:');
    }
    
    return () => {
      const lifetime = Date.now() - mountTime.current;
      console.log(`🧹 [${name}] Desmontado após ${lifetime}ms (${renderCount.current} renders)`);
    };
  });

  return <>{children}</>;
};