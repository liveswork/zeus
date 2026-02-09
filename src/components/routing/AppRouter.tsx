// src/components/routing/AppRouter.tsx
import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingScreen } from '../ui/LoadingScreen';
import { ProtectedRoute } from './ProtectedRoute';

// 🟢 CORREÇÃO DOS IMPORTS LAZY
// Usamos .then(module => ({ default: module.NomeDoComponente })) para funcionar com 'export const'

const PanelRouter = React.lazy(() => 
  import('./PanelRouter').then(module => ({ default: module.PanelRouter }))
);

// Auth Components
const Login = React.lazy(() => 
  import('../auth/Login').then(module => ({ default: module.Login }))
);
const Register = React.lazy(() => 
  import('../auth/Register').then(module => ({ default: module.Register }))
);

// Public Pages
const PublicLayout = React.lazy(() => 
  import('../layout/PublicLayout').then(module => ({ default: module.PublicLayout }))
);
const LandingPage = React.lazy(() => 
  import('../public/LandingPage').then(module => ({ default: module.LandingPage }))
);

// 🟢 OTIMIZAÇÃO: Converti os diretórios públicos para Lazy também (Performance)
const RestaurantDirectory = React.lazy(() => 
  import('../public/business/food/directory/RestaurantDirectory').then(module => ({ default: module.RestaurantDirectory }))
);
const SupplierDirectory = React.lazy(() => 
  import('../public/supplier/SupplierDirectory').then(module => ({ default: module.SupplierDirectory }))
);
const RetailDirectory = React.lazy(() => 
  import('../public/business/Retail/directory/RetailDirectory').then(module => ({ default: module.RetailDirectory }))
);

const PublicRetailCatalogPage = React.lazy(() => 
  import('../public/business/Retail/catalog/PublicRetailCatalogPage').then(module => ({ default: module.PublicRetailCatalogPage }))
);

const PublicCatalogPage = React.lazy(() => 
  import('../public/business/food/catalog/PublicCatalogPage').then(module => ({ default: module.PublicCatalogPage }))
);
const PublicSupplierCatalogPage = React.lazy(() => 
  import('../public/supplier/PublicSupplierCatalogPage').then(module => ({ default: module.PublicSupplierCatalogPage }))
);

export const AppRouter: React.FC = () => {
  const { loading } = useAuth();

  // 🟢 TELA DE BOOT DO NEXUS OS
  if (loading) {
    return <LoadingScreen message="Inicializando Nexus OS v12.0..." />;
  }

  return (
    
     

      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* --- ROTAS PÚBLICAS --- */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/restaurantes" element={<RestaurantDirectory />} />
            <Route path="/fornecedores" element={<SupplierDirectory />} />
            <Route path="/lojas" element={<RetailDirectory />} />
            <Route path="/catalogo/:restaurantId" element={<PublicCatalogPage />} />
            {/* ✅ ADICIONE ESTA LINHA: Rota do Catálogo de Varejo */}
            <Route path="/loja/:storeId" element={<PublicRetailCatalogPage />} />
            <Route path="/fornecedor/:supplierId" element={<PublicSupplierCatalogPage />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Register />} />
          </Route>

          {/* --- ROTA PROTEGIDA DO PAINEL --- */}
          <Route
            path="/painel/*"
            element={
              <ProtectedRoute>
                <PanelRouter />
              </ProtectedRoute>
            }
          />

          {/* Rota de fallback geral */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    
  );
};