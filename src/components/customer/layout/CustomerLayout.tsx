import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, User, LogOut, List, MapPin, DollarSign } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface CustomerLayoutProps {
  children: ReactNode;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  const { userProfile, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/painel/dashboard', icon: Home },
    { name: 'Meus Pedidos', href: '/painel/orders', icon: ShoppingCart },
    { name: 'Ganhar Dinheiro', href: '/painel/marketing', icon: DollarSign },
    { name: 'Meu Perfil', href: '/painel/profile', icon: User },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm p-4 md:hidden">
        <h1 className="text-xl font-bold text-gray-800">
          Olá, {userProfile?.displayName}!
        </h1>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-slate-800 text-white min-h-screen p-4 hidden md:flex md:flex-col">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold">Olá, {userProfile?.displayName}!</h2>
            <p className="text-sm text-gray-400">Área do Cliente</p>
          </div>

          <nav className="flex-grow">
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
                      <span className="ml-4">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <button 
            onClick={logout} 
            className="w-full flex items-center p-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition duration-200 mt-auto"
          >
            <LogOut size={20} />
            <span className="ml-4">Sair</span>
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 flex justify-around">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`p-3 flex flex-col items-center w-full ${
                isActive(item.href) ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};