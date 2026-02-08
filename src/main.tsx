import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { CrashBoundary } from './core/errors/CrashBoundary';
import { startRuntimeCrashGuard } from './core/runtime/runtimeCrashGuard';

startRuntimeCrashGuard();

createRoot(document.getElementById('root')!).render(
  <CrashBoundary>
    <StrictMode>
      <App />
    </StrictMode>
  </CrashBoundary>
);
