import React, { Suspense, useState, useEffect } from 'react';

import { Toaster } from 'react-hot-toast';
import './index.css';
import './i18n';

// 🟢 KERNEL LEVEL PROVIDERS (A Ordem Importa!)
import { AuthProvider } from './contexts/AuthContext';
import { BusinessProvider } from './contexts/BusinessContext';
import { UIProvider } from './contexts/UIContext';
import { PrintProvider } from './contexts/PrintContext';
import { AIMonitoringProvider } from './contexts/AIMonitoringContext';
import { HashRouter } from 'react-router-dom';
import { CrashBoundary } from './core/errors/CrashBoundary';
// 🟢 SHELL LOADER
import { AppRouter } from './components/routing/AppRouter';
import { PrintManager } from './components/print/PrintManager';
import { ConfirmationDialog } from './components/ui/ConfirmationDialog';
import { BootScreen } from './components/system/BootScreen';
import { SystemBoot } from './components/system/SystemBoot';
import { SystemShell } from './components/system/SystemShell';
import { NetworkProvider } from './contexts/NetworkContext';



function App() {
  // 🟢 ESTADO PARA CONTROLAR A INTRODUÇÃO
  // Em produção inicia true. Em dev você pode mudar para false para não ver o video toda hora.
  const [showBootVideo, setShowBootVideo] = useState(true);

  // Opcional: Salvar no sessionStorage para não mostrar o vídeo se der F5
  useEffect(() => {
    const hasBooted = sessionStorage.getItem('nexus_has_booted');
    if (hasBooted) {
      setShowBootVideo(false);
    }
  }, []);

  const handleBootComplete = () => {
    sessionStorage.setItem('nexus_has_booted', 'true');
    setShowBootVideo(false);
  };
  return (
    <>

      {/* 1. BIOS: Autenticação e Segurança */}
      <CrashBoundary>
        <NetworkProvider>
          <AuthProvider>

            {/* 2. SYSTEM SERVICES: Dados de Negócio (Agora acessível globalmente) */}
            <BusinessProvider>
              {/* 3. INTERFACE DRIVERS: UI e Feedback */}
              <UIProvider>
                {/* 4. BACKGROUND PROCESSES: IA e Impressão */}
                <AIMonitoringProvider>
                  <PrintProvider>

                    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
                      {/* 🟢 VÍDEO DE BOOT - SOBREPOSIÇÃO GLOBAL */}
                      {showBootVideo && (
                        <SystemBoot onComplete={handleBootComplete} />
                      )}

                      {/* O Shell é carregado aqui */}
                      <HashRouter>
                        <Suspense fallback={<BootScreen message="Carregando Kernel..." />}>
                          <SystemShell />
                        </Suspense>
                      </HashRouter>

                      {/* Serviços Globais de UI */}
                      <Toaster
                        position="bottom-right"
                        toastOptions={{
                          className: 'bg-gray-800 text-white',
                          duration: 4000,
                          style: {
                            background: '#1f2937',
                            color: '#fff',
                            borderRadius: '8px',
                          },
                        }}
                      />
                      <PrintManager />
                      <ConfirmationDialog />
                    </div>

                  </PrintProvider>
                </AIMonitoringProvider>
              </UIProvider>
            </BusinessProvider>

          </AuthProvider>
        </NetworkProvider>
      </CrashBoundary>
    </>
  );
}

export default App;