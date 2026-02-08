// src/components/business/modules/purchases/PurchasesApp.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { NexusPurchaseManager } from '../NexusPurchaseManager'; // Criaremos este
import { SupplierMarketplace } from './SupplierMarketplace'; // E este

export const PurchasesApp: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="suppliers" replace />} />
      <Route path="suppliers" element={<SupplierMarketplace />} />
      <Route path="nexus-ai" element={<NexusPurchaseManager />} />
      {/* Outras rotas como 'histórico', 'orçamentos' podem vir aqui */}
    </Routes>
  );
};