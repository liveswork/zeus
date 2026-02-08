import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BusinessApp } from '../business/BusinessApp';
import { SupplierApp } from '../supplier/SupplierApp';
import { CustomerApp } from '../customer/CustomerApp';
import { AdminApp } from '../admin/AdminApp';

export const PanelRouter: React.FC = () => {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  switch (userProfile.role) {
    case 'business':
    case 'restaurante':
      return <BusinessApp />;
    case 'supplier':
    case 'fornecedor':
      return <SupplierApp />;
    case 'customer':
    case 'cliente':
      return <CustomerApp />;
    case 'superadmin':
      return <AdminApp />;
    default:
      return <Navigate to="/login" replace />;
  }
};