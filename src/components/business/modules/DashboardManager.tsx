import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';

// Importe os dashboards especializados
// Certifique-se de ter movido o código antigo para FoodDashboard.tsx
import { FoodDashboard } from '../food/FoodDashboard'; 
import { RetailDashboard } from '../retail/RetailDashboard';

export const DashboardManager: React.FC = () => {
  const { userProfile } = useAuth();
  const businessType = userProfile?.businessProfile?.type || 'generic';

  // Lista de tipos de varejo
  const retailTypes = ['retail', 'fashion', 'otica', 'construction', 'varejo', 'loja_roupas', 'vestuario'];

  if (retailTypes.includes(businessType)) {
    return <RetailDashboard />;
  }

  // Padrão: Food Service (Dashboard com Mesas, Receitas, etc.)
  return <FoodDashboard />;
};