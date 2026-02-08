import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Utensils, Menu, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

export const PublicHeader: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md p-4 sticky top-0 z-40">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
          <Utensils /> FoodPDV
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 items-center">
          <div className="flex items-center gap-2 text-sm text-gray-700 mr-6">
            <MapPin size={16} className="text-red-500" />
            <div>
              <p className="text-xs text-gray-500">Entregar em</p>
              <p className="font-bold">Av. Maj. Williams, 2198</p>
            </div>
          </div>
          
          <Link to="/restaurantes" className="text-gray-600 hover:text-blue-600 font-semibold">
            Restaurantes
          </Link>
          <Link to="/lojas" className="text-gray-600 hover:text-blue-600 font-semibold">
            Lojas
          </Link>
          <Link to="/fornecedores" className="text-gray-600 hover:text-blue-600">
            Fornecedores
          </Link>
          
          {userProfile ? (
            <>
              <Link to="/painel" className="text-gray-600 hover:text-blue-600 font-semibold">
                Meu Painel
              </Link>
              <button onClick={logout} className="text-red-500 font-semibold">
                Sair
              </button>
            </>
          ) : (
            <div className="flex gap-4 items-center">
              <Link to="/login" className="text-gray-600 hover:text-blue-600 font-bold">
                Entrar
              </Link>
              <Link to="/cadastro" className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-bold">
                Cadastrar
              </Link>
            </div>
          )}
          
          <LanguageSwitcher />
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <nav className="md:hidden mt-4 space-y-2 border-t pt-4">
          <Link to="/restaurantes" className="block p-2 text-gray-600 hover:bg-gray-100 rounded">
            Restaurantes
          </Link>
          <Link to="/lojas" className="block p-2 text-gray-600 hover:bg-gray-100 rounded">
            Lojas
          </Link>
          <Link to="/fornecedores" className="block p-2 text-gray-600 hover:bg-gray-100 rounded">
            Fornecedores
          </Link>
          {userProfile ? (
            <>
              <Link to="/painel" className="block p-2 text-gray-600 hover:bg-gray-100 rounded">
                Meu Painel
              </Link>
              <button onClick={logout} className="block w-full text-left p-2 text-red-500 hover:bg-gray-100 rounded">
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block p-2 text-gray-600 hover:bg-gray-100 rounded">
                Entrar
              </Link>
              <Link to="/cadastro" className="block p-2 text-green-600 hover:bg-gray-100 rounded font-bold">
                Cadastrar
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
};