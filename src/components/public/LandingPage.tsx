import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, ShoppingCart, Truck, BarChart2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold mb-6">
          Bem-vindo ao <span className="text-blue-400">Nexxus OS</span>
        </h1>
        <p className="text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Sua jornada está prestes a começar. Descubra sabores, histórias e oportunidades.
        </p>
        
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center max-w-4xl mx-auto">
          <Link
            to="/restaurantes"
            className="flex-1 group bg-gradient-to-r from-red-500 to-red-600 p-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
          >
            <Utensils size={48} className="mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold mb-2">Restaurantes</h2>
            <p className="text-red-100">Explore os melhores sabores da região</p>
          </Link>

          <Link
            to="/lojas"
            className="flex-1 group bg-gradient-to-r from-green-500 to-green-600 p-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
          >
            <ShoppingCart size={48} className="mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold mb-2">Lojas</h2>
            <p className="text-green-100">Encontre produtos únicos e especiais</p>
          </Link>

          <Link
            to="/fornecedores"
            className="flex-1 group bg-gradient-to-r from-blue-500 to-blue-600 p-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
          >
            <Truck size={48} className="mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold mb-2">Fornecedores</h2>
            <p className="text-blue-100">Conecte-se com parceiros de qualidade</p>
          </Link>
        </div>

        <div className="mt-12">
          <Link
            to="/cadastro"
            className="inline-block bg-white text-blue-900 font-bold py-4 px-8 rounded-full text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
          >
            Começar Agora - É Grátis!
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white/10 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Tudo que você precisa em um só lugar
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl bg-white/5 backdrop-blur">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Gestão Completa</h3>
              <p className="text-gray-300">
                PDV, delivery, estoque, financeiro e muito mais em uma plataforma integrada.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-white/5 backdrop-blur">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Marketplace Integrado</h3>
              <p className="text-gray-300">
                Conecte-se com fornecedores e clientes em um ecossistema completo.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-white/5 backdrop-blur">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart2 size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Inteligência de Negócio</h3>
              <p className="text-gray-300">
                Relatórios avançados e insights para otimizar seu negócio.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};