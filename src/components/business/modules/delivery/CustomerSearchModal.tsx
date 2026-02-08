import React, { useState } from 'react';
import { Search, Phone, User, Loader, CheckCircle, UserPlus, Sparkles, Globe, Building } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { Modal } from '../../../ui/Modal';
import { FormField } from '../../../ui/FormField';
import { useUI } from '../../../../contexts/UIContext';
import { formatPhoneNumber, normalizePhoneNumber } from '../../../../utils/formatters';

interface CustomerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerFound: (customer: any) => void;
}

export const CustomerSearchModal: React.FC<CustomerSearchModalProps> = ({
  isOpen,
  onClose,
  onCustomerFound
}) => {
  const { showAlert } = useUI();
  const [customerPhone, setCustomerPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [showCustomerCard, setShowCustomerCard] = useState(false);

  const searchCustomerByPhone = async () => {
    if (!customerPhone.trim()) {
      showAlert('Digite um número de telefone', 'error');
      return;
    }

    const normalizedPhone = normalizePhoneNumber(customerPhone);
    if (!normalizedPhone) {
      showAlert('Número de telefone inválido', 'error');
      return;
    }

    setSearching(true);
    setFoundCustomer(null);
    setShowCustomerCard(false);

    try {
      // 🔍 BUSCA GLOBAL: Procurar cliente em todo o ecossistema FoodPDV
      const globalCustomersQuery = query(
        collection(db, 'globalCustomers'),
        where('phone', '==', normalizedPhone)
      );
      
      const globalCustomersSnapshot = await getDocs(globalCustomersQuery);
      
      if (!globalCustomersSnapshot.empty) {
        // ✅ CLIENTE ENCONTRADO NO ECOSSISTEMA
        const globalCustomerDoc = globalCustomersSnapshot.docs[0];
        const globalCustomerData = globalCustomerDoc.data();
        
        const customer = {
          globalId: globalCustomerDoc.id,
          uid: globalCustomerData.uid || null,
          displayName: globalCustomerData.name,
          name: globalCustomerData.name,
          email: globalCustomerData.email || '',
          phone: formatPhoneNumber(customerPhone),
          normalizedPhone: normalizedPhone,
          isNewCustomer: false,
          isGlobalCustomer: true,
          globalData: globalCustomerData,
          totalSpent: globalCustomerData.totalSpent || 0,
          orderCount: globalCustomerData.orderCount || 0,
          establishmentCount: globalCustomerData.establishmentCount || 1
        };
        
        setFoundCustomer(customer);
        setShowCustomerCard(true);
        
        setTimeout(() => {
          showAlert('Cliente encontrado no ecossistema FoodPDV!', 'success');
        }, 500);
      } else {
        // ❌ CLIENTE NÃO ENCONTRADO - CRIAR NOVO NO ECOSSISTEMA
        const newCustomer = {
          globalId: null,
          uid: null,
          displayName: '',
          name: '',
          email: '',
          phone: formatPhoneNumber(customerPhone),
          normalizedPhone: normalizedPhone,
          isNewCustomer: true,
          isGlobalCustomer: false,
          globalData: null,
          totalSpent: 0,
          orderCount: 0,
          establishmentCount: 0
        };
        
        setFoundCustomer(newCustomer);
        setShowCustomerCard(true);
        showAlert('Cliente não encontrado. Será criado um novo cadastro no ecossistema.', 'info');
      }
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      showAlert('Erro ao buscar cliente no ecossistema', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCustomer = () => {
    if (foundCustomer) {
      onCustomerFound(foundCustomer);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchCustomerByPhone();
    }
  };

  const resetSearch = () => {
    setCustomerPhone('');
    setFoundCustomer(null);
    setShowCustomerCard(false);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Buscar Cliente no Ecossistema" 
      size="lg"
    >
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-8 text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-4 left-4 w-24 h-24 bg-yellow-300 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-pink-400 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Globe className="text-white" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Sistema Global FoodPDV</h2>
                  <p className="text-blue-100 text-sm">Busca unificada em todo o ecossistema</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <Sparkles size={16} />
                <span>Um telefone = Um cliente único • Sem duplicatas</span>
              </div>
            </div>
            
            <div className="hidden md:block relative">
              <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center">
                  <User size={40} className="text-white" />
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-pink-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>

        {/* Campo de busca */}
        <div className="space-y-4">
          <FormField label="Telefone/WhatsApp do Cliente">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                placeholder="(85) 99999-9999"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(formatPhoneNumber(e.target.value))}
                onKeyPress={handleKeyPress}
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-gray-50 hover:bg-white"
                disabled={searching}
                autoFocus
              />
              {customerPhone && (
                <button
                  onClick={resetSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          </FormField>

          <button
            onClick={searchCustomerByPhone}
            disabled={searching || !customerPhone.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
          >
            {searching ? (
              <div className="flex items-center justify-center gap-3">
                <Loader size={20} className="animate-spin" />
                <span>Buscando no ecossistema...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Search size={20} />
                <span>Buscar Cliente Global</span>
              </div>
            )}
          </button>
        </div>

        {/* Card do Cliente Encontrado */}
        {showCustomerCard && foundCustomer && (
          <div className={`transform transition-all duration-700 ${showCustomerCard ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-200/30 rounded-full blur-xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                      {foundCustomer.isNewCustomer ? (
                        <UserPlus className="text-white" size={24} />
                      ) : (
                        <Globe className="text-white" size={24} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {foundCustomer.isNewCustomer ? 'Novo Cliente Global' : 'Cliente do Ecossistema'}
                      </h3>
                      <p className="text-green-600 text-sm font-medium">
                        {foundCustomer.isNewCustomer 
                          ? 'Será criado no ecossistema FoodPDV' 
                          : `Ativo em ${foundCustomer.establishmentCount} estabelecimento(s)`
                        }
                      </p>
                    </div>
                  </div>
                  
                  {!foundCustomer.isNewCustomer && (
                    <div className="flex flex-col items-end gap-2">
                      <div className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Globe size={12} />
                        GLOBAL
                      </div>
                      {foundCustomer.orderCount > 0 && (
                        <div className="text-xs text-green-700 font-medium">
                          {foundCustomer.orderCount} pedidos • R$ {foundCustomer.totalSpent?.toFixed(2)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl">
                      <User size={18} className="text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Nome</p>
                        <p className="font-semibold text-gray-800">
                          {foundCustomer.displayName || 'A definir no cadastro'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl">
                      <Phone size={18} className="text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Telefone</p>
                        <p className="font-semibold text-gray-800">{foundCustomer.phone}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {foundCustomer.email && (
                      <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">E-mail</p>
                          <p className="font-semibold text-gray-800">{foundCustomer.email}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl">
                      <div className={`w-4 h-4 rounded-full ${foundCustomer.isNewCustomer ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Status</p>
                        <p className="font-semibold text-gray-800">
                          {foundCustomer.isNewCustomer ? 'Novo no ecossistema' : 'Cliente global ativo'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSelectCustomer}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle size={20} />
                    <span>
                      {foundCustomer.isNewCustomer ? 'Criar Cliente Global' : 'Selecionar Cliente'}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instruções */}
        {!showCustomerCard && (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-blue-500" />
              Como funciona o Sistema Global
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Digite o telefone/WhatsApp do cliente</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>O sistema busca em <strong>todo o ecossistema FoodPDV</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Se encontrado, os dados são carregados automaticamente</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Se não encontrado, cria um <strong>cliente global único</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Sem duplicatas:</strong> um telefone = um cliente global</span>
              </li>
            </ul>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
};