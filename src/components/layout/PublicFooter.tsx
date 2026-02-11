import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, Phone, Mail, Instagram, MapPin } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Utensils /> Nexxus OS
            </h2>
            <p className="text-gray-400 text-sm">
              Sua plataforma completa para gestão e delivery, conectando negócios, fornecedores e clientes.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-bold uppercase tracking-wider mb-4">Plataforma</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/restaurantes" className="hover:text-blue-400">
                  Restaurantes
                </Link>
              </li>
              <li>
                <Link to="/lojas" className="hover:text-blue-400">
                  Lojas
                </Link>
              </li>
              <li>
                <Link to="/fornecedores" className="hover:text-blue-400">
                  Fornecedores
                </Link>
              </li>
              <li>
                <Link to="/cadastro" className="hover:text-blue-400">
                  Seja um Parceiro
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold uppercase tracking-wider mb-4">Contato</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Mail size={16} /> contato@nexxusos.com.br
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} /> (85) 98925-6925
              </li>
              <li className="flex items-center gap-2">
                <Instagram size={16} /> @nexxusos
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-gray-900 py-4">
        <div className="container mx-auto px-8 flex justify-between items-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Nexxus Os. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};