import React from "react";
import { Link } from "react-router-dom";
import { Utensils, Phone, Mail, Instagram, MapPin, ShieldCheck, FileText } from "lucide-react";

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Top */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
                <Utensils size={20} />
              </div>
              <div className="text-xl font-extrabold">yndex</div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Plataforma completa para gestão e delivery, conectando negócios, fornecedores e clientes em um só lugar.
            </p>

            <div className="flex items-start gap-2 text-sm text-gray-300">
              <MapPin size={16} className="mt-0.5 text-red-400" />
              <span>Brasil • Operação regional</span>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-extrabold uppercase tracking-wider text-sm mb-4">Plataforma</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/restaurantes" className="hover:text-white">Restaurantes</Link></li>
              <li><Link to="/lojas" className="hover:text-white">Lojas</Link></li>
              <li><Link to="/fornecedores" className="hover:text-white">Fornecedores</Link></li>
              <li><Link to="/cadastro" className="hover:text-white">Seja um parceiro</Link></li>
              <li><Link to="/ajuda" className="hover:text-white">Central de ajuda</Link></li>
            </ul>
          </div>

          {/* Discover */}
          <div>
            <h3 className="font-extrabold uppercase tracking-wider text-sm mb-4">Descubra</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#entregador" className="hover:text-white">Quero entregar</a></li>
              <li><a href="#parceiros" className="hover:text-white">Quero vender</a></li>
              <li><a href="#carreiras" className="hover:text-white">Carreiras</a></li>
              <li><Link to="/seguranca" className="hover:text-white">Dicas de segurança</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-extrabold uppercase tracking-wider text-sm mb-4">Contato</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <span>contato@yndex.com.br</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                <span>(85) 98925-6925</span>
              </li>
              <li className="flex items-center gap-2">
                <Instagram size={16} className="text-gray-400" />
                <span>@yndex</span>
              </li>
            </ul>

            <div className="mt-6 flex gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-bold"
              >
                Entrar
              </Link>
              <Link
                to="/cadastro"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-bold"
              >
                Cadastrar
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 py-5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Nexxus OS. Todos os direitos reservados.</p>

          <div className="flex flex-wrap gap-4">
            <Link to="/termos" className="hover:text-white inline-flex items-center gap-1">
              <FileText size={14} /> Termos
            </Link>
            <Link to="/privacidade" className="hover:text-white inline-flex items-center gap-1">
              <ShieldCheck size={14} /> Privacidade
            </Link>
            <Link to="/seguranca" className="hover:text-white">
              Segurança
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
