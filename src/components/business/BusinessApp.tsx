import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { useBusiness, BusinessProvider } from '../../contexts/BusinessContext'; 
import { BusinessLayout } from './layout/BusinessLayout';

// Importe todos os módulos do Business
import { DashboardManager } from './modules/DashboardManager';
import { SalesManager } from './food/modules/balcao/SalesManager';
import { CashierManager } from './modules/CashierManager';
import { TableManager } from './food/modules/table/TableManager';
import { PDVManager } from './modules/PDVManager';
import { DeliveryManager } from './modules/DeliveryManager';
import { CampaignManager } from './modules/marketing/CampaignManager';
import { CreatorStudio } from './modules/composer/CreatorStudio';
import { WhatsappChat } from './modules/whatsapp/WhatsappChat';
import { ReportsManager } from './modules/ReportsManager';
import { SubscriptionPage } from './modules/subscription/SubscriptionPage';
import { DebtsManager } from './modules/financial/DebtsManager';
import { ExtensionStore } from './modules/ExtensionStore';
import { SettingsManager } from './modules/SettingsManager';
import { EssenceAdminPanel } from './modules/foodverse/EssenceAdminPanel';
import { JourneyAdminPanel } from './modules/foodverse/JourneyAdminPanel';
import { LiveEventManager } from './modules/foodverse/LiveEventManager';
import { RegistrationsApp } from './modules/registrations/RegistrationsApp';
import { PurchasesApp } from './modules/purchases/PurchasesApp';
import { SupplierMarketplace } from './modules/purchases/SupplierMarketplace';
import { NexusPurchaseManager } from './modules/NexusPurchaseManager';

import { PrintManager } from '../print/PrintManager';
import { AIMonitoringPanel } from '../ai/AIMonitoringPanel';




export const BusinessApp: React.FC = () => {
  useAuth();
  const { loading } = useBusiness();
  useUI();

  if (loading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <p className="text-xl">Carregando dados do negócio...</p>
      </div>
    );
  }

  return (
   // <BusinessProvider>
      <BusinessLayout>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardManager />} />
          <Route path="sales" element={<SalesManager />} />
          <Route path="cashier" element={<CashierManager />} />
          <Route path="tables" element={<TableManager />} />
          <Route path="pdv" element={<PDVManager />} />
          <Route path="delivery" element={<DeliveryManager />} />
          <Route path="marketing/campanhas" element={<CampaignManager />} />
          <Route path="composer" element={<CreatorStudio />} />
          <Route path="whatsapp_chat" element={<WhatsappChat />} />
          <Route path="reports" element={<ReportsManager />} />
          <Route path="assinatura" element={<SubscriptionPage />} />
          <Route path="financeiro/contas-a-pagar" element={<DebtsManager />} />
          <Route path="extensoes" element={<ExtensionStore />} />
          <Route path="settings" element={<SettingsManager />} />
        

          <Route path="foodverse/essencia" element={<EssenceAdminPanel />} />
          <Route path="foodverse/jornadas" element={<JourneyAdminPanel />} />
          <Route path="foodverse/eventos" element={<LiveEventManager />} />

          <Route path="registrations/*" element={<RegistrationsApp />} />
          <Route path="compras/*" element={<PurchasesApp />} />
          <Route path="marketplace" element={<SupplierMarketplace />} />
          <Route path="compras/nexus-ai" element={<NexusPurchaseManager />} />

          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>

        <PrintManager />
        <AIMonitoringPanel />
      </BusinessLayout>
   // </BusinessProvider>
  );
};