import React, { useState, useMemo } from 'react';
import { PlusCircle, Edit, Trash2, Users, Search, Phone, Mail, MapPin, Calendar, Eye, BarChart3, Globe, Building, TrendingUp, DollarSign } from 'lucide-react';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { useUI } from '../../../../contexts/UIContext';
import { CustomerFormModal } from './CustomerFormModal';
import { CustomerDetailsModal } from './CustomerDetailsModal';
import { formatPhoneNumber, formatDate, formatCurrency } from '../../../../utils/formatters';

export const CustomersManager: React.FC = () => {
  const { businessId, localCustomers, orders } = useBusiness();
  const { showAlert, showConfirmation } = useUI();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Calcular estatísticas reais
  const customerStats = useMemo(() => {
    const totalCustomers = localCustomers.length;
    const activeCustomers = localCustomers.filter(c => c.orderCount > 0).length;
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const newThisMonth = localCustomers.filter(c => {
      const createdAt = c.createdAt?.toDate?.() || new Date(c.createdAt);
      return createdAt >= thisMonth;
    }).length;
    
    const retentionRate = totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0;
    
    return {
      totalCustomers,
      activeCustomers,
      newThisMonth,
      retentionRate
    };
  }, [localCustomers]);

  const filteredCustomers = useMemo(() => {
    return localCustomers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterType === 'all' || 
                           (filterType === 'recent' && (customer.orderCount || 0) > 0) ||
                           (filterType === 'inactive' && (customer.orderCount || 0) === 0);
      
      return matchesSearch && matchesFilter;
    });
  }, [localCustomers, searchTerm, filterType]);

  const handleOpenModal = (customer = null) => {
    setCurrentCustomer(customer);
    setIsModalOpen(true);
  };

  const handleOpenDetails = (customer) => {
    setCurrentCustomer(customer);
    setIsDetailsModalOpen(true);
  };

  const handleDelete = (customerId: string, customerName: string) => {
    showConfirmation(`Tem certeza que deseja excluir o cliente "${customerName}"?`, async () => {
      try {
        // ✅ CORREÇÃO: Usa o 'id' do documento do cliente local para a verificação
        const customerOrders = orders.filter(o => o.customerId === customerId);
        if (customerOrders.length > 0) {
          showAlert('Não é possível excluir cliente com pedidos realizados', 'error');
          return;
        }

        await deleteDoc(doc(db, 'users', businessId, 'localCustomers', customerId));
        showAlert('Cliente excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        showAlert('Erro ao excluir cliente', 'error');
      }
    });
  };

  const filterOptions = [
    { id: 'all', label: 'Todos os Clientes' },
    { id: 'recent', label: 'Com Pedidos' },
    { id: 'inactive', label: 'Sem Pedidos' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Base de Clientes</h1>
          <p className="text-gray-600 mt-1">Sistema global integrado do ecossistema FoodPDV</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center hover:bg-blue-700 transition shadow-lg"
        >
          <PlusCircle size={20} className="mr-2" />
          Novo Cliente
        </button>
      </div>

      {/* Stats Cards com dados reais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total de Clientes</p>
              <p className="text-3xl font-bold">{customerStats.totalCustomers}</p>
            </div>
            <Users size={32} className="text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Clientes Ativos</p>
              <p className="text-3xl font-bold">{customerStats.activeCustomers}</p>
            </div>
            <TrendingUp size={32} className="text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Novos Este Mês</p>
              <p className="text-3xl font-bold">{customerStats.newThisMonth}</p>
            </div>
            <PlusCircle size={32} className="text-purple-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Taxa de Retenção</p>
              <p className="text-3xl font-bold">{customerStats.retentionRate}%</p>
            </div>
            <Eye size={32} className="text-orange-200" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            {filterOptions.map(option => (
              <button
                key={option.id}
                onClick={() => setFilterType(option.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  filterType === option.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm || filterType !== 'all' 
                ? 'Nenhum cliente encontrado' 
                : 'Nenhum cliente cadastrado'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold">Cliente</th>
                  <th className="px-6 py-4 font-semibold">Contato</th>
                  <th className="px-6 py-4 font-semibold">Estatísticas</th>
                  <th className="px-6 py-4 font-semibold">Último Pedido</th>
                  <th className="px-6 py-4 font-semibold">Cadastrado em</th>
                  <th className="px-6 py-4 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => {
                  // ✅ CORREÇÃO: A busca de pedidos agora usa o campo 'customerId' que contém o Auth UID
                  const customerOrders = orders.filter(o => o.customerId === customer.customerId);
                  const totalSpent = customerOrders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount || 0), 0);
                  const lastOrder = customerOrders.sort((a, b) => new Date(b.createdAt?.toDate?.() || b.date).getTime() - new Date(a.createdAt?.toDate?.() || a.date).getTime())[0];
                  
                  return (
                    <tr key={customer.id} className="bg-white border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{customer.name}</p>
                            <div className="flex items-center gap-2">
                              {customer.globalCustomerId ? (
                                <div className="flex items-center gap-1">
                                  <Globe size={12} className="text-green-500" />
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                    GLOBAL
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Building size={12} className="text-orange-500" />
                                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                    LOCAL
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone size={14} />
                              {formatPhoneNumber(customer.phone)}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail size={14} />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign size={14} className="text-green-500" />
                            <span className="font-semibold text-green-600">
                              {formatCurrency(totalSpent)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <TrendingUp size={14} />
                            <span>{customerOrders.length} pedidos</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lastOrder ? (
                          <div>
                            <span className="text-sm text-green-600 font-medium">
                              {formatDate(lastOrder.createdAt?.toDate?.() || lastOrder.date)}
                            </span>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(lastOrder.finalAmount || lastOrder.totalAmount)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Nunca pediu</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(customer.createdAt?.toDate?.() || customer.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenDetails(customer)}
                            className="group relative p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-full transition-all"
                          >
                            <BarChart3 size={16} />
                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Ver Detalhes e Editar
                            </div>
                          </button>
                          
                          <button
                            onClick={() => handleDelete(customer.id, customer.name)}
                            className="group relative p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-all"
                          >
                            <Trash2 size={16} />
                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Excluir Cliente
                            </div>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {isModalOpen && (
        <CustomerFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={currentCustomer}
        />
      )}

      {isDetailsModalOpen && currentCustomer && (
        <CustomerDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          customer={currentCustomer}
        />
      )}
    </div>
  );
};