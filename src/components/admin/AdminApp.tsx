import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './layout/AdminLayout';
import { AdminDashboard } from './modules/AdminDashboard';
import { AdminUsers } from './modules/AdminUsers';
import { AdminSettings } from './modules/AdminSettings';
import { PlansManager } from './modules/PlansManager';
import { ExtensionsManager } from './modules/ExtensionsManager';
import { NexusAdminDashboard } from './modules/NexusAdminDashboard';
import { MigrationApp } from './modules/migration/MigrationApp';
import { BroadcastManager } from './modules/BroadcastManager'; 
import { BusinessTypeManager } from './modules/BusinessTypeManager';

export const AdminApp: React.FC = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="plans" element={<PlansManager />} />
        <Route path="extensions" element={<ExtensionsManager />} /> 
        <Route path="nexus" element={<NexusAdminDashboard />} />
        <Route path="tools/*" element={<MigrationApp />} />
        <Route path="broadcast-studio" element={<BroadcastManager />} />
        <Route path="settings" element={<AdminSettings />} />

        {/* ✅ NOVA ROTA ADICIONADA */}
        <Route path="/business-types" element={<BusinessTypeManager />} />

        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
};