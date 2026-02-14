import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Users, Settings, LogOut, Shield, 
  Clipboard, Package, Zap, Wrench, MessageSquare, 
  Layers, Tags, Briefcase, Building2, 
  ChevronDown, ChevronRight, Activity, DollarSign, Megaphone,
  Store,
  ShoppingBag,
  Utensils,
  Server
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();
  
  // Estado para controlar quais menus estão expandidos
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Nexus HQ': true // Mantém o HQ aberto por padrão
  });

  const toggleMenu = (name: string) => {
    setExpandedMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const navigation = [
    { name: 'Dashboard', href: '/painel/dashboard', icon: Home },
    
    // --- MENU COM SUB-ITENS (NEXUS HQ) ---
    { 
      name: 'Nexus HQ', 
      icon: Building2,
      // href é opcional aqui pois é um container
      children: [
        { name: 'Intelligence (BI)', href: '/painel/corporate/intelligence', icon: Activity },
        { name: 'Nexus HR', href: '/painel/corporate/hr', icon: Users },
        { name: 'Nexus Finance', href: '/painel/corporate/finance', icon: DollarSign },
        { name: 'Nexus Marketing', href: '/painel/corporate/marketing', icon: Megaphone },
      ]
    },

    { name: 'Usuários', href: '/painel/users', icon: Users },

    // --- GESTÃO DE REDE DE LOJAS (NOVO) ---
    { 
      name: 'Nexus Stores', 
      icon: Store, // Importe Store de lucide-react
      children: [
        { name: 'Dashboard Rede', href: '/painel/stores/overview', icon: Activity },
        { name: 'Todas as Lojas', href: '/painel/stores/list', icon: ShoppingBag },
        { name: 'Food Service', href: '/painel/stores/food', icon: Utensils },
        { name: 'Varejo / Retail', href: '/painel/stores/retail', icon: ShoppingBag },
        { name: 'Uso de Recursos', href: '/painel/stores/resources', icon: Server },
      ]
    },
    
    // --- GESTÃO DE NEGÓCIO ---
    { name: 'Tipos de Negócio', href: '/painel/business-types', icon: Briefcase }, 
    { name: 'Categorias Globais', href: '/painel/categories', icon: Layers },
    { name: 'Subcategorias', href: '/painel/subcategories', icon: Tags },

    { name: 'Planos', href: '/painel/plans', icon: Clipboard },
    { name: 'Extensões', href: '/painel/extensions', icon: Package },
    { name: 'Nexus Monitor', href: '/painel/nexus', icon: Zap },
    { name: 'Ferramentas', href: '/painel/tools', icon: Wrench },
    { name: 'Marketing Studio', href: '/painel/broadcast-studio', icon: MessageSquare },
    
    { name: 'Configurações', href: '/painel/settings', icon: Settings },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col shadow-2xl h-full fixed md:relative z-20 transition-all duration-300">
        {/* Profile Section */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-700 bg-slate-900/50">
          <div className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-lg bg-indigo-600 border-2 border-indigo-400 shadow-lg shadow-indigo-500/30">
            <Shield size={20} />
          </div>
          <div className="flex-grow overflow-hidden">
            <p className="font-bold text-white text-sm whitespace-nowrap truncate">Super Admin</p>
            <p className="text-[10px] text-indigo-300 font-medium uppercase tracking-wider">Master Access</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow overflow-y-auto custom-scrollbar p-3">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedMenus[item.name];
              // Verifica se algum filho está ativo para destacar o pai
              const isChildActive = hasChildren && item.children?.some(child => isActive(child.href));

              if (hasChildren) {
                return (
                  <li key={item.name} className="mb-1">
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${
                        isChildActive || isExpanded
                          ? 'bg-slate-700 text-white' 
                          : 'text-gray-400 hover:bg-slate-700/50 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon size={20} className={`${isChildActive ? 'text-indigo-400' : 'group-hover:text-indigo-400'}`} />
                        <span className="ml-3 font-medium text-sm">{item.name}</span>
                      </div>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {/* Sub-menu Render */}
                    {isExpanded && (
                      <ul className="mt-1 ml-4 space-y-1 border-l-2 border-slate-700 pl-2">
                        {item.children?.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = isActive(child.href);
                          return (
                            <li key={child.name}>
                              <Link
                                to={child.href}
                                className={`flex items-center p-2 rounded-lg text-sm transition-all ${
                                  childActive
                                    ? 'bg-indigo-600/20 text-indigo-300 font-bold'
                                    : 'text-gray-500 hover:text-white hover:bg-slate-700/50'
                                }`}
                              >
                                <ChildIcon size={16} className="mr-3 opacity-70" />
                                {child.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              // Item Normal (Sem filhos)
              const active = isActive(item.href || '');
              return (
                <li key={item.name}>
                  <Link
                    to={item.href || '#'}
                    className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
                      active 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'text-gray-400 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <Icon size={20} className={`${active ? 'text-white' : 'group-hover:text-indigo-400'}`} />
                    <span className="ml-3 font-medium text-sm">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-slate-700 pt-4 mt-auto p-3">
          <button 
            onClick={logout} 
            className="w-full flex items-center p-3 rounded-xl text-gray-400 hover:bg-red-600 hover:text-white transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="ml-4 font-bold">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-[#f8fafc] w-full"> 
        {children}
      </main>
    </div>
  );
};