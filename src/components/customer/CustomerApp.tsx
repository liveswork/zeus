import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CustomerLayout } from './layout/CustomerLayout';
import { CustomerDashboard } from './modules/CustomerDashboard';
import { CustomerOrders } from './modules/CustomerOrders';
import { CustomerProfile } from './modules/CustomerProfile';
import { useAuth } from '../../contexts/AuthContext';
import { AffiliateOnboarding } from './modules/marketing/AffiliateOnboarding';
import { AffiliateHub } from './modules/marketing/AffiliateHub';

export const CustomerApp: React.FC = () => {
      // --- 2. PEGAR O PERFIL DO USUÁRIO ---
  const { userProfile } = useAuth();
  return (
    <CustomerLayout>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="orders" element={<CustomerOrders />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route 
          path="marketing" 
          element={
            userProfile?.isAffiliate ? <AffiliateHub /> : <AffiliateOnboarding />
          } 
        />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </CustomerLayout>
  );
};