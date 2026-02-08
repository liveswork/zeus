import React, { useState } from 'react';
import { ShoppingCart, Clock, CheckCircle, XCircle } from 'lucide-react';

export const CustomerOrders: React.FC = () => {
  const [orders] = useState([]); // Will be connected to context
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'pending', label: 'Em Andamento' },
    { id: 'completed', label: 'Finalizados' },
    { id: 'canceled', label: 'Cancelados' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Meus Pedidos</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition ${
              activeFilter === filter.id 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum pedido encontrado</p>
            <p className="text-gray-400 text-sm">Seus pedidos aparecerão aqui após serem realizados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Orders will be mapped here */}
          </div>
        )}
      </div>
    </div>
  );
};