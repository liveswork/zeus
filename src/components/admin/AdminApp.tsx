import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './layout/AdminLayout';

// Módulos Comuns
import { AdminDashboard } from './modules/AdminDashboard';
import { AdminUsers } from './modules/AdminUsers';
import { AdminSettings } from './modules/AdminSettings';
import { PlansManager } from './modules/PlansManager';
import { ExtensionsManager } from './modules/ExtensionsManager';
import { NexusAdminDashboard } from './modules/NexusAdminDashboard';
import { MigrationApp } from './modules/migration/MigrationApp';
import { BroadcastManager } from './modules/BroadcastManager';
import { BusinessTypeManager } from './modules/BusinessTypeManager';
import { TaxonomyManager } from './modules/TaxonomyManager';

// --- Módulos Stores (Novos) ---
import { StoresDashboard } from './modules/stores/StoresDashboard';
import { StoreListModule } from './modules/stores/StoreListModule';

// --- Módulos Corporativos (Novos) ---
import { IntelligenceManager } from './modules/corporate/IntelligenceManager';
import { HRManager } from './modules/corporate/HRManager';
import { FinanceManager } from './modules/corporate/FinanceManager';
import { MarketingManager } from './modules/corporate/MarketingManager';

export const AdminApp: React.FC = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />

        {/* --- ROTAS CORPORATIVAS (HIERÁRQUICAS) --- */}
        <Route path="corporate">
          {/* Redireciona /corporate para intelligence por padrão */}
          <Route index element={<Navigate to="intelligence" replace />} />

          <Route path="intelligence" element={<IntelligenceManager />} />
          <Route path="hr" element={<HRManager />} />
          <Route path="finance" element={<FinanceManager />} />
          <Route path="marketing" element={<MarketingManager />} />
        </Route>

        {/* Rotas Padrão */}
        <Route path="users" element={<AdminUsers />} />

        {/* --- ROTAS DE ESTABELECIMENTOS (NEXUS STORES) --- */}
        <Route path="stores">
          <Route index element={<Navigate to="overview" replace />} />

          <Route path="overview" element={<StoresDashboard />} />

          {/* Reutilizamos o mesmo componente de Lista, mas poderíamos filtrar via prop se quiséssemos */}
          <Route path="list" element={<StoreListModule />} />
          <Route path="food" element={<StoreListModule />} />
          <Route path="retail" element={<StoreListModule />} />

          <Route path="resources" element={<div className="p-8">Módulo de Recursos em desenvolvimento</div>} />
        </Route>

        <Route path="plans" element={<PlansManager />} />
        <Route path="extensions" element={<ExtensionsManager />} />
        <Route path="nexus" element={<NexusAdminDashboard />} />
        <Route path="tools/*" element={<MigrationApp />} />
        <Route path="broadcast-studio" element={<BroadcastManager />} />
        <Route path="settings" element={<AdminSettings />} />

        {/* Gestão de Taxonomia */}
        <Route path="business-types" element={<BusinessTypeManager />} />
        <Route path="categories" element={<TaxonomyManager />} />
        <Route path="subcategories" element={<TaxonomyManager />} />

        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
};