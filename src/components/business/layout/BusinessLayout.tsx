import React, { useState, ReactNode } from 'react';
import { subscriptionGuard } from '../../../services/subscriptionGuard';
import { href, Link, useLocation } from 'react-router-dom';
import {
  Home, Package, ShoppingCart, Clipboard, Wallet, BarChart2,
  Settings, LogOut, ChevronsLeft, ChevronsRight, Edit, Crown,
  Truck, User, Users, MapPin, Building, UserCheck,
  TrendingUp, Zap, ShoppingBag, PenSquare, MessagesSquare, SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface BusinessLayoutProps {
  children: ReactNode;
}

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
                    className={`p-3 flex flex-col items-center w-full transition-colors ${
                        location.pathname.startsWith(item.href) ? 'text-orange-600' : 'text-gray-500'
                    }`}
                >
                    <item.icon size={24} />
                    <span className="text-xs mt-1">{item.label}</span>
                </Link>
            ))}
        </nav>
    );
};

export const BusinessLayout: React.FC<BusinessLayoutProps> = ({ children }) => {
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Defina as rotas de tela cheia onde a sidebar não deve ser exibida
  const fullScreenRoutes = ['/painel/pdv', '/painel/delivery', '/painel/sales', '/painel/tables'];
  const isFullScreenPage = fullScreenRoutes.includes(location.pathname);

  // Defina a navegação com base no plano de assinatura do usuário      
  const navigation = [
    { name: 'Inicio', href: '/painel/dashboard', icon: Home },
    { name: 'Caixa', href: '/painel/cashier', icon: Wallet },
    {
        name: 'Impulso Marketing',
        href: '/painel/marketing',
        icon: TrendingUp,
        submenu: [
            { name: 'Campanhas', href: '/painel/marketing/campanhas', icon: TrendingUp },
            // --- [NOVO] Módulos FoodVerse e BI ---
            { name: 'Card de Essência', href: '/painel/foodverse/essencia', icon: Edit },
            { name: 'Jornadas', href: '/painel/foodverse/jornadas', icon: Zap },
            { name: 'Eventos ao Vivo', href: '/painel/foodverse/eventos', icon: Zap },
            { name: 'Business Intelligence', href: '/painel/bi', icon: BarChart2 },
        ]
    },
   // ...(subscriptionGuard.hasAccess('marketing_advanced') ? [{ name: 'Impulso Marketing', href: '/painel/marketing', icon: TrendingUp }] : []),
    
    {
      name: 'Vendas',
      href: '/painel/sales',
      icon: ShoppingCart,
      submenu: [
        { name: 'Venda Rápida (Balcão)', href: '/painel/sales', icon: ShoppingCart },
        { name: 'Mesas / Comandas', href: '/painel/tables', icon: Clipboard },
       // ...(subscriptionGuard.hasAccess('mesas_comandas') ? [{ name: 'Mesas / Comandas', href: '/painel/tables', icon: Clipboard }] : []),
       // { name: 'PDV (Varejo)', href: '/painel/pdv', icon: ShoppingCart },
        { name: 'Delivery', href: '/painel/delivery', icon: Truck },
      ]
    },
    { name: 'Chat Ativo', href: '/painel/whatsapp_chat', icon: MessagesSquare },

    {
      name: 'Compras',
      href: '/painel/compras', // Rota base para o grupo
      icon: ShoppingBag,
      submenu: [
        { name: 'Marketplace', href: '/painel/compras/suppliers', icon: Truck },
        ...(subscriptionGuard.hasAccess('nexus_ai')
          ? [{ name: 'Assistente Nexus', href: '/painel/compras/nexus-ai', icon: Zap }]
          : [])
      ]
    },
    {
        name: 'Financeiro',
        href: '/painel/financeiro',
        icon: Wallet, // Ícone apropriado para financeiro
        submenu: [
            { name: 'Contas a Pagar', href: '/painel/financeiro/contas-a-pagar', icon: Wallet },
        ]
    },
    {
      name: 'Estúdio de Criação',
      href: '/painel/composer',
      icon: PenSquare,
      submenu: [
          { name: 'Comandas de Massa', href: '/painel/composer', icon: PenSquare },
      ]
    },

    {
      name: 'Cadastros',
      href: '/painel/registrations',
      icon: Users,
      submenu: [
        { name: 'Produtos', href: '/painel/registrations/products', icon: Package },
        { name: 'Categorias', href: '/painel/registrations/categories', icon: Edit },
        { name: 'Ingredientes', href: '/painel/registrations/supplies', icon: Package },
        { name: 'Complementos', href: '/painel/registrations/addons', icon: SlidersHorizontal },
        { name: 'Mesas', href: '/painel/registrations/tables', icon: Clipboard },
        { name: 'Clientes', href: '/painel/registrations/customers', icon: Users },
        { name: 'Fornecedores', href: '/painel/registrations/suppliers', icon: Truck },
        { name: 'Funcionários', href: '/painel/registrations/employees', icon: UserCheck },
        { name: 'Taxas de Entrega', href: '/painel/registrations/delivery-fees', icon: MapPin },
        { name: 'Dados da Empresa', href: '/painel/registrations/company', icon: Building },
      ]
    },
    { name: 'Relatórios', href: '/painel/reports', icon: BarChart2 },
    { name: 'Extensões', href: '/painel/extensoes', icon: Package },
    { name: 'Configurações', href: '/painel/settings', icon: Settings },
  ];

  // ... restante do componente sem alterações
  const isActive = (href: string) => location.pathname === href;
  const isSubmenuActive = (submenu: any[]) => submenu?.some(item => location.pathname === item.href);

  // Se for uma página de tela cheia, não renderizamos a sidebar
  if (isFullScreenPage) {
    return (
      <div className="flex h-screen bg-gray-100">
        <main className="flex-1 p-0 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  } 

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`hidden lg:flex ${isSidebarOpen ? 'w-60' : 'w-20'} bg-slate-800 text-white flex-col p-3 transition-all duration-300`}>
        {/* Profile Section */}
        <div className="flex items-center gap-3 p-3 border-b border-slate-700 mb-4">
          <div className="w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-xl bg-blue-600 overflow-hidden border-2 border-slate-600">
            {userProfile?.logoUrl ? (
              <img src={userProfile.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              userProfile?.companyName?.charAt(0) || 'A'
            )}
          </div>

          {isSidebarOpen && (
            <div className="flex-grow overflow-hidden">
              <p className="font-bold text-white text-md whitespace-nowrap truncate">
                {userProfile?.companyName}
              </p>
              <p className="text-xs text-blue-300">Administrador</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-grow overflow-y-auto">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isItemActive = isActive(item.href) || (hasSubmenu && isSubmenuActive(item.submenu));

              return (
                <li key={item.name} className="space-y-1">
                  {hasSubmenu ? (
                    <div>
                      <div className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 ${isItemActive
                          ? 'bg-slate-700 text-white'
                          : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                        }`}>
                        <Icon size={20} />
                        <span className={`ml-4 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                          {item.name}
                        </span>
                      </div>
                      {isSidebarOpen && (
                        <ul className="ml-6 space-y-1">
                          {item.submenu.map((subItem) => {
                            const SubIcon = subItem.icon;
                            return (
                              <li key={subItem.name}>
                                <Link
                                  to={subItem.href}
                                  className={`w-full flex items-center p-2 rounded-lg transition-colors duration-200 text-sm ${isActive(subItem.href)
                                      ? 'bg-blue-600 text-white'
                                      : 'text-gray-400 hover:bg-slate-600 hover:text-white'
                                    }`}
                                >
                                  <SubIcon size={16} />
                                  <span className="ml-3">{subItem.name}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive(item.href)
                          ? 'bg-slate-700 text-white'
                          : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                        }`}
                    >
                      <Icon size={20} />
                      <span className={`ml-4 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                        {item.name}
                      </span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-gray-700 p-4">
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
            onClick={logout}
            className="w-full flex items-center p-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition duration-200"
          >
            {isSidebarOpen ? (
              <>
                <LogOut size={20} />
                <span className="ml-4">Sair</span>
              </>
            ) : (
              <LogOut size={20} className="mx-auto" />
            )}
          </button>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center p-3 rounded-lg text-gray-300 hover:bg-blue-800 mt-2"
          >
            {isSidebarOpen ? (
              <>
                <ChevronsLeft size={20} />
                <span className="ml-4">Recolher</span>
              </>
            ) : (
              <ChevronsRight size={20} className="mx-auto" />
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:p-8 p-4 pb-24">
        {children}
      </main>

      {/* Nova Navegação Mobile */}
      <MobileBottomNav />
    </div>
  );
};