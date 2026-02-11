// src/components/business/modules/registrations/RegistrationsApp.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FoodProductsManager } from '../../food/modules/products/ProductsManager';
import { SuppliesManager } from '../SuppliesManager';
import { TablesManager } from '../../food/modules/table/TablesManager';
import { CategoriesManager } from './CategoriesManager';
import { CustomersManager } from './CustomersManager';
import { SuppliersManager } from './SuppliersManager';
import { EmployeesManager } from './EmployeesManager';
import { DeliveryFeesManager } from './DeliveryFeesManager';
import { CompanyManager } from './CompanyManager';
import { AddonsManager } from './AddonsManager'; // Importação correta

export const RegistrationsApp: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="products" replace />} />
      <Route path="products" element={<FoodProductsManager />} />
      <Route path="supplies" element={<SuppliesManager />} />
      <Route path="categories" element={<CategoriesManager />} />
      {/* Rota para complementos no local correto */}
      <Route path="addons" element={<AddonsManager />} />
      <Route path="tables" element={<TablesManager />} />
      <Route path="customers" element={<CustomersManager />} />
      <Route path="suppliers" element={<SuppliersManager />} />
      <Route path="employees" element={<EmployeesManager />} />
      <Route path="delivery-fees" element={<DeliveryFeesManager />} />
      <Route path="company" element={<CompanyManager />} />
      {/* Rota de fallback "*" sempre por último */}
      <Route path="*" element={<Navigate to="products" replace />} />
    </Routes>
  );
};