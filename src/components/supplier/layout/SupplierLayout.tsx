import React, { useState, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Package, ShoppingBasket, Settings, LogOut, ChevronsLeft, 
  ChevronsRight, Truck, User, TrendingUp, ClipboardList
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface SupplierLayoutProps {
  children: ReactNode;
}

export const SupplierLayout: React.FC<SupplierLayoutProps> = ({ children }) => {
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Dashboard', href: '/painel/dashboard', icon: Home },
    { name: 'PDV de Vendas', href: '/painel/pdv', icon: ClipboardList },
    { name: 'Meu Catálogo', href: '/painel/catalog', icon: Package },
    { name: 'Pedidos Recebidos', href: '/painel/orders', icon: ShoppingBasket },
    { name: 'Impulso Marketing', href: '/painel/marketing', icon: TrendingUp },
    { name: 'Configurações', href: '/painel/settings', icon: Settings },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-60' : 'w-20'} bg-slate-800 text-white flex flex-col p-3 transition-all duration-300`}>
        {/* Profile Section */}
        <div className="flex items-center gap-3 p-3 border-b border-slate-700 mb-4">
          <div className="w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-xl bg-blue-600 overflow-hidden border-2 border-slate-600">
            <Truck size={24} />
          </div>
          
          {isSidebarOpen && (
            <div className="flex-grow overflow-hidden">
              <p className="font-bold text-white text-md whitespace-nowrap truncate">
                {userProfile?.companyName || 'Fornecedor'}
              </p>
              <p className="text-xs text-blue-300">Fornecedor</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-grow overflow-y-auto">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 ${
                      isActive(item.href) 
                        ? 'bg-slate-700 text-white' 
                        : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    <span className={`ml-4 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-gray-700 pt-4">
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
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};