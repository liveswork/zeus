// src/components/admin/modules/migration/MigrationApp.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DataImporter } from './DataImporter';

export const MigrationApp: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="import" replace />} />
      <Route path="import" element={<DataImporter />} />
      {/* Futuramente, a rota de exportação virá aqui */}
    </Routes>
  );
};