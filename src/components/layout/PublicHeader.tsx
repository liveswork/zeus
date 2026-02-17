import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, MapPin } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";

export const PublicHeader: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md p-4 sticky top-0 z-40">
      <div className="container mx-auto flex justify-between items-center">
        
        {/* 🔥 ESQUERDA: LOGO + MENU */}
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            yndex
          </Link>

          {/* MENU AO LADO DA LOGO */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/restaurantes" className="text-gray-600 hover:text-blue-600 font-semibold">
              Restaurantes
            </Link>

            <Link to="/lojas" className="text-gray-600 hover:text-blue-600 font-semibold">
              Lojas
            </Link>

            <Link to="/fornecedores" className="text-gray-600 hover:text-blue-600">
              Fornecedores
            </Link>
          </nav>
        </div>

        {/* 🔥 DIREITA: ENDEREÇO + USUÁRIO */}
        <div className="hidden md:flex items-center gap-6">
          {/* endereço */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin size={16} className="text-red-500" />
            <div>
              <p className="text-xs text-gray-500">Entregar em</p>
              <p className="font-bold">Rua. Major Agostinho, 2198</p>
            </div>
          </div>

          {/* usuário */}
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
            <>
              <Link to="/login" className="text-gray-600 hover:text-blue-600 font-bold">
                Entrar
              </Link>

              <Link
                to="/cadastro"
                className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-bold"
              >
                Cadastrar
              </Link>
            </>
          )}

          <LanguageSwitcher />
        </div>

        {/* MOBILE MENU BUTTON */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
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
        </nav>
      )}
    </header>
  );
};
