import React, { useState } from 'react';
import { ShoppingBasket, Clock, CheckCircle, Package } from 'lucide-react';

export const SupplierOrders: React.FC = () => {
  const [orders] = useState([]); // Will be connected to context
  const [activeTab, setActiveTab] = useState('pending');

  const tabs = [
    { id: 'pending', label: 'Pendentes', icon: <Clock size={18} /> },
    { id: 'confirmed', label: 'Confirmados', icon: <CheckCircle size={18} /> },
    { id: 'completed', label: 'Finalizados', icon: <ShoppingBasket size={18} /> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Pedidos Recebidos</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-lg shadow-sm">
        <nav className="flex space-x-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 p-2 text-center font-semibold rounded transition ${
                activeTab === tab.id 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Orders List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBasket size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum pedido recebido ainda</p>
            <p className="text-gray-400 text-sm">Os pedidos aparecerão aqui quando você receber</p>
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