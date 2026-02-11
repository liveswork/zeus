import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Settings, 
  LogOut, 
  Shield, 
  Clipboard, 
  Package, 
  Zap, 
  Wrench, 
  MessageSquare,
  Layers, 
  Tags,
  Briefcase // <--- IMPORTANTE: Importar este ícone novo
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/painel/dashboard', icon: Home },
    { name: 'Usuários', href: '/painel/users', icon: Users },
    
    // --- GESTÃO DE MENU E NEGÓCIOS (O Cérebro) ---
    { name: 'Tipos de Negócio', href: '/painel/business-types', icon: Briefcase }, // <--- ADICIONADO AQUI
    
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
      <aside className="w-60 bg-slate-800 text-white flex flex-col p-3 shadow-2xl h-full fixed md:relative z-20">
        {/* Profile Section */}
        <div className="flex items-center gap-3 p-3 border-b border-slate-700 mb-4">
          <div className="w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-xl bg-red-600 border-2 border-slate-600 shadow-inner">
            <Shield size={24} />
          </div>
          
          <div className="flex-grow overflow-hidden">
            <p className="font-bold text-white text-md whitespace-nowrap truncate">
              Super Admin
            </p>
            <p className="text-xs text-red-300 font-medium">Administrador</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow overflow-y-auto custom-scrollbar">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
                      active 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'text-gray-400 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <Icon size={20} className={`${active ? 'text-white' : 'group-hover:text-indigo-400'}`} />
                    <span className="ml-4 font-medium text-sm">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-slate-700 pt-4 mt-auto">
          <button 
            onClick={logout} 
            className="w-full flex items-center p-3 rounded-xl text-gray-400 hover:bg-red-600 hover:text-white transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="ml-4 font-bold">Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-[#f8fafc] w-full "> {/* ml-60 compensa o fixed sidebar se necessário */}
        {children}
      </main>
    </div>
  );
};