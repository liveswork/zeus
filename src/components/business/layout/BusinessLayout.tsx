//src/components/business/layout/BusinessLayout.tsx

import React, { useState, useEffect, ReactNode, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu, LogOut,
  LayoutDashboard, // Ícone padrão caso falte
  Store,
  Crown,
  Home,
  Truck,
  Wallet,
  Clipboard
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

// --- IMPORTAÇÕES DO PILAR 1 E FIREBASE ---
import { FEATURE_MAP, MENU_GROUPS } from '../../../config/features';
import { doc, getDoc } from 'firebase/firestore';
import { subscriptionGuard } from '../../../services/subscriptionGuard';
import { db } from '../../../config/firebase';

// Mapeamento de Rota: Conecta a "Chave da Feature" com o "Link do Navegador"
// Isso separa a definição do botão (ícone/nome) do destino dele.
const PATH_MAPPING: Record<string, string> = {
  'dashboard': '/painel/dashboard',
  'bi_dashboard': '/painel/reports',
  'vendas_pdv': '/painel/pdv',
  'vendas_mesas': '/painel/tables',
  'vendas_balcao': '/painel/sales',
  'vendas_delivery': '/painel/delivery',
  'caixa_atual': '/painel/cashier',
  'financeiro_contas_pagar': '/painel/financeiro/contas-a-pagar',
  'marketing': '/painel/marketing/campanhas',
  'cadastros_produtos': '/painel/registrations/products',
  'cadastros_categorias': '/painel/registrations/categories',
  'cadastros_clientes': '/painel/registrations/customers',
  'cadastros_fornecedores': '/painel/registrations/suppliers',
  'cadastros_funcionarios': '/painel/registrations/employees',
  'cadastros_entregas': '/painel/registrations/delivery-fees',
  'cadastros_empresa': '/painel/registrations/company',
  'configuracoes': '/painel/settings',
  'marketplace_compras': '/painel/marketplace',
  'extensoes': '/painel/extensoes',
  'whatsapp_chat': '/painel/whatsapp_chat',
  'composer': '/painel/composer',
  'financeiro': '/painel/financeiro',
  // --- Marketing / Foodverse ---
'marketing_journeys': '/painel/foodverse/jornadas',
'marketing_events': '/painel/foodverse/eventos',
'cadastros_essencia': '/painel/foodverse/essencia',

// --- Relatórios ---
'relatorios': '/painel/reports',

// --- Extensões ---
'loja_extensoes': '/painel/extensoes',

// --- Compras ---
'compras_ver': '/painel/compras',                 // ou '/painel/compras' (ajuste se tiver index)
'compras_orcamentos': '/painel/compras/orcamentos', // só se essa rota existir

// --- Cadastros ---
'cadastros_insumos': '/painel/registrations/supplies',
'cadastros_mesas': '/painel/registrations/tables',
'cadastros_taxas_delivery': '/painel/registrations/delivery-fees',

// --- Utilitários / Outros ---
'recuperador_de_vendas': '/painel/sales/recover' // só se existir; senão crie a rota ou mude o path

};

// Componente para a nova barra de navegação inferior
const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navItems = [
    { href: '/painel/dashboard', icon: Home, label: 'Início' },
    { href: '/painel/delivery', icon: Truck, label: 'Delivery' },
    { href: '/painel/tables', icon: Clipboard, label: 'Mesas' },
    { href: '/painel/sales', icon: Wallet, label: 'Balcão' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 flex justify-around">
      {navItems.map(item => (
        <Link
          key={item.label}
          to={item.href}
          className={`p-3 flex flex-col items-center w-full transition-colors ${location.pathname.startsWith(item.href) ? 'text-orange-600' : 'text-gray-500'
            }`}
        >
          <item.icon size={24} />
          <span className="text-xs mt-1">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};
// 1. Definindo a interface para aceitar children
interface BusinessLayoutProps {
  children: ReactNode;
}

// 2. Aplicando a interface no componente
export const BusinessLayout: React.FC<BusinessLayoutProps> = ({ children }) => {
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [availableMenu, setAvailableMenu] = useState<any>({});
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Fecha sidebar no mobile ao trocar de rota
  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // --- LÓGICA DO PILAR 3: CARREGAR MENU DINÂMICO ---
  useEffect(() => {
    const fetchBusinessConfig = async () => {
      // Se o usuário não tiver tipo de negócio definido, aborta
      if (!userProfile?.businessProfile?.type) {
        setLoadingMenu(false);
        return;
      }

      setLoadingMenu(true);
      try {
        // 1. Pega os IDs que estão no perfil do usuário
        const mainCategoryKey = userProfile.businessProfile.type; // ex: food_service
        const subCategoryKey = userProfile.businessProfile.subCategory; // ex: pizzaria

        // 2. Vai na coleção ANTIGA 'business_categories' buscar as regras
        const configRef = doc(db, 'business_categories', mainCategoryKey);
        const configSnap = await getDoc(configRef);

        let allowedFeatures: string[] = [];

        if (configSnap.exists()) {
          const data = configSnap.data();

          // Procura a subcategoria correta dentro do array
          const subCategoryData = data.subCategories?.find((sub: any) => sub.key === subCategoryKey);

          if (subCategoryData && subCategoryData.features) {
            // ACHOU! Usa as features salvas no banco antigo
            allowedFeatures = subCategoryData.features;
          } else {
            // Se não achar, usa um básico de segurança
            allowedFeatures = ['dashboard', 'configuracoes'];
          }
        } else {
          // Fallback se a categoria não existir
          allowedFeatures = ['dashboard', 'configuracoes'];
        }

        // 3. Monta o menu visualmente
        const grouped: any = {};
        Object.keys(MENU_GROUPS).forEach(g => grouped[g] = []);

        console.log('[MENU] allowedFeatures =', allowedFeatures);
        const missingInMap = allowedFeatures.filter(k => !FEATURE_MAP[k]);
        const missingPath = allowedFeatures.filter(k => !PATH_MAPPING[k]);

        console.table({ missingInMap, missingPath });

        allowedFeatures.forEach(key => {
          const feature = FEATURE_MAP[key];
          if (feature && PATH_MAPPING[key]) {
            const group = feature.group || 'main';
            if (!grouped[group]) grouped[group] = [];

            grouped[group].push({
              key,
              label: feature.label,
              icon: feature.icon,
              path: PATH_MAPPING[key]
            });
          }
        });

        setAvailableMenu(grouped);
      } catch (error) {
        console.error("Erro ao carregar menu:", error);
      } finally {
        setLoadingMenu(false);
      }
    };

    fetchBusinessConfig();
  }, [userProfile]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao sair', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Overlay Mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
                    fixed md:relative z-50 h-full bg-white border-r border-gray-200 shadow-xl md:shadow-none
                    transition-all duration-300 ease-in-out flex flex-col
                    ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-20 md:translate-x-0'}
                `}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center border-b border-gray-100 px-4">
          {isSidebarOpen ? (
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              NEXXUS OS
            </h1>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              N
            </div>
          )}
        </div>

        {/* --- MENU DINÂMICO RENDERIZADO AQUI --- */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-hide">
          {loadingMenu ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            // Ordena os grupos (Main -> Vendas -> Financeiro...)
            Object.entries(MENU_GROUPS)
              .sort(([, a]: any, [, b]: any) => a.order - b.order)
              .map(([groupKey, groupConfig]: any) => {
                const items = availableMenu[groupKey];

                // Se o grupo não tem itens habilitados para esse usuário, não renderiza
                if (!items || items.length === 0) return null;

                return (
                  <div key={groupKey}>
                    {/* Título do Grupo (Só mostra se Sidebar aberta) */}
                    {isSidebarOpen && (
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                        {groupConfig.label}
                      </h3>
                    )}

                    <div className="space-y-1">
                      {items.map((item: any) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon || LayoutDashboard;

                        return (
                          <Link
                            key={item.key}
                            to={item.path}
                            className={`
                                                            flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                                                            ${isActive
                                ? 'bg-blue-50 text-blue-600 font-medium shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }
                                                        `}
                            title={!isSidebarOpen ? item.label : ''}
                          >
                            <Icon
                              size={20}
                              className={`
                                                                ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}
                                                                ${!isSidebarOpen && 'mx-auto'}
                                                            `}
                            />

                            {isSidebarOpen && (
                              <span className="ml-3 truncate">{item.label}</span>
                            )}

                            {/* Tooltip quando fechado */}
                            {!isSidebarOpen && (
                              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                {item.label}
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })
          )}
        </nav>

        {/* Footer do Sidebar */}
        <div className="p-4 border-t border-gray-100">
          <Link to="/painel/assinatura">
            <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-3 rounded-lg transition-all duration-200 flex items-center justify-center mb-3">
              <Crown className="w-5 h-5 mr-2" />
              <div className="text-left">
                <div className="text-sm font-semibold">Plano Atual</div>
                <div className="text-xs opacity-90">Gerenciar</div>
              </div>
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className={`
                            flex items-center w-full px-3 py-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors
                            ${!isSidebarOpen && 'justify-center'}
                        `}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="ml-3 font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header Mobile / Toggle Desktop */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-900">
                {userProfile?.companyName || userProfile?.displayName}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {userProfile?.businessProfile?.type?.replace('_', ' ') || 'Empresa'}
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200">
              <Store size={16} />
            </div>
          </div>
        </header>

        {/* Área de Scroll do Conteúdo */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6 pb-24 md:pb-6">
          {children}
        </div>
      </main>

      {/* Nova Navegação Mobile */}
      <MobileBottomNav />

    </div>
  );
};