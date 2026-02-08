import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SupplierLayout } from './layout/SupplierLayout';
import { SupplierDashboard } from './modules/SupplierDashboard';
import { SupplierCatalog } from './modules/SupplierCatalog';
import { SupplierOrders } from './modules/SupplierOrders';
import { SupplierSettings } from './modules/SupplierSettings';
import { SupplierCampaignManager } from './modules/marketing/SupplierCampaignManager';
import SupplierPDV from './modules/balcao/PDVVendas';

export const SupplierApp: React.FC = () => {
  return (
    <SupplierLayout>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SupplierDashboard />} />
        <Route path="pdv" element={<SupplierPDV />} />
        <Route path="catalog" element={<SupplierCatalog />} />
        <Route path="orders" element={<SupplierOrders />} />
        <Route path="marketing" element={<SupplierCampaignManager />} />
        <Route path="settings" element={<SupplierSettings />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </SupplierLayout>
  );
};