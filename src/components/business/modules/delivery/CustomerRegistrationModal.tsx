import React, { useState } from 'react';
import { User, MapPin, Phone, Mail, Save, Plus, Home, Navigation, CheckCircle2, AlertCircle, Globe, Building } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Modal } from '../../../ui/Modal';
import { FormField } from '../../../ui/FormField';
import { useUI } from '../../../../contexts/UIContext';
import { formatCurrency, normalizePhoneNumber } from '../../../../utils/formatters';

interface CustomerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerData: any;
  onCustomerRegistered: (addresses: any[]) => void;
}

export const CustomerRegistrationModal: React.FC<CustomerRegistrationModalProps> = ({
  isOpen,
  onClose,
  customerData,
  onCustomerRegistered
}) => {
  const { showAlert } = useUI();
  const { businessId, deliveryFees } = useBusiness();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: customerData.displayName || customerData.name || '',
    phone: customerData.phone || '',
    email: customerData.email || '',
    addresses: [
      {
        label: 'Principal',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: 'MARACANAÚ',
        zipCode: '',
        reference: '',
        deliveryFee: 0
      }
    ]
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.map((addr, i) => 
        i === index ? { 
          ...addr, 
          [field]: value,
          ...(field === 'neighborhood' && deliveryFees.length > 0 ? {
            deliveryFee: deliveryFees.find(fee => 
              fee.neighborhood.toLowerCase() === value.toLowerCase()
            )?.fee || 0
          } : {})
        } : addr
      )
    }));
  };

  const addNewAddress = () => {
    setFormData(prev => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        {
          label: `Endereço ${prev.addresses.length + 1}`,
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: 'MARACANAÚ',
          zipCode: '',
          reference: '',
          deliveryFee: 0
        }
      ]
    }));
  };

  const removeAddress = (index: number) => {
    if (formData.addresses.length > 1) {
      setFormData(prev => ({
        ...prev,
        addresses: prev.addresses.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showAlert('Nome do cliente é obrigatório', 'error');
      return;
    }

    if (!formData.phone.trim()) {
      showAlert('Telefone do cliente é obrigatório', 'error');
      return;
    }

    const hasValidAddress = formData.addresses.some(addr => 
      addr.street.trim() && addr.neighborhood.trim()
    );

    if (!hasValidAddress) {
      showAlert('Pelo menos um endereço com rua e bairro é obrigatório', 'error');
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = normalizePhoneNumber(formData.phone);
      let globalCustomerId = customerData.globalId;

      // 🌍 CRIAR/ATUALIZAR CLIENTE GLOBAL
      if (customerData.isNewCustomer) {
        // Criar novo cliente global no ecossistema
        const globalCustomerRef = await addDoc(collection(db, 'globalCustomers'), {
          name: formData.name,
          phone: normalizedPhone,
          email: formData.email,
          uid: customerData.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          totalSpent: 0,
          orderCount: 0,
          establishmentCount: 1,
          lastOrderDate: null,
          loyaltyPoints: 0,
          loyaltyLevel: 'Bronze'
        });
        
        globalCustomerId = globalCustomerRef.id;
        showAlert('Cliente criado no ecossistema FoodPDV!', 'success');
      } else {
        // Cliente já existe globalmente, incrementar contador de estabelecimentos
        const globalCustomerRef = doc(db, 'globalCustomers', customerData.globalId);
        await updateDoc(globalCustomerRef, {
          name: formData.name,
          email: formData.email,
          establishmentCount: (customerData.establishmentCount || 0) + 1,
          updatedAt: serverTimestamp()
        });
      }

      // 🏪 CRIAR CLIENTE LOCAL DO ESTABELECIMENTO
      const localCustomerRef = await addDoc(collection(db, 'users', businessId, 'localCustomers'), {
        globalCustomerId: globalCustomerId,
        customerId: customerData.uid,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        createdAt: serverTimestamp(),
        lastOrderDate: null,
        totalSpent: 0,
        orderCount: 0,
        loyaltyPoints: 0,
        loyaltyLevel: 'Bronze'
      });

      // 📍 SALVAR ENDEREÇOS LOCAIS
      const savedAddresses = [];
      for (const address of formData.addresses) {
        if (address.street.trim() && address.neighborhood.trim()) {
          const addressRef = await addDoc(collection(db, 'users', businessId, 'customerAddresses'), {
            globalCustomerId: globalCustomerId,
            localCustomerId: localCustomerRef.id,
            customerId: customerData.uid,
            label: address.label,
            fullAddress: `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}`,
            street: address.street,
            number: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            city: address.city,
            zipCode: address.zipCode,
            reference: address.reference,
            deliveryFee: address.deliveryFee,
            createdAt: serverTimestamp()
          });
          
          savedAddresses.push({
            id: addressRef.id,
            ...address,
            fullAddress: `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}`
          });
        }
      }

      showAlert(
        customerData.isNewCustomer 
          ? 'Cliente criado no ecossistema e endereços cadastrados!' 
          : 'Endereços cadastrados para cliente existente!', 
        'success'
      );
      
      onCustomerRegistered(savedAddresses);
      
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      showAlert('Erro ao cadastrar cliente', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={customerData.isNewCustomer ? "Criar Cliente Global" : "Cadastrar Endereços"} 
      maxWidth="max-w-7xl" // <--- MUDANÇA AQUI (Deixa bem largo)
    >
      <div className="bg-gray-50 h-[70vh]">
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 bg-white border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                {customerData.isNewCustomer ? (
                  <Globe size={20} className="text-white" />
                ) : (
                  <Building size={20} className="text-white" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {customerData.isNewCustomer ? 'Novo Cliente Global' : 'Cliente Existente'}
                </h3>
                <p className="text-sm text-gray-500">
                  {customerData.isNewCustomer 
                    ? 'Será criado no ecossistema FoodPDV' 
                    : 'Adicionar endereços para este estabelecimento'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8">
              {/* Informações Pessoais */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Globe size={18} className="text-blue-500" />
                  Informações Globais do Cliente
                </h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Nome Completo">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg text-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-300 transition-all"
                      required
                    />
                  </FormField>
                  
                  <FormField label="Telefone/WhatsApp">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-700"
                      required
                      readOnly
                    />
                  </FormField>
                  
                  <FormField label="E-mail (opcional)">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg text-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-300 transition-all"
                    />
                  </FormField>
                </div>
              </div>

              {/* Endereços */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Building size={18} className="text-orange-500" />
                    Endereços para Este Estabelecimento
                  </h4>
                  <button
                    type="button"
                    onClick={addNewAddress}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Adicionar
                  </button>
                </div>

                <div className="space-y-6">
                  {formData.addresses.map((address, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="font-medium text-gray-800">{address.label}</h5>
                        {formData.addresses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAddress(index)}
                            className="text-gray-500 hover:text-red-600 transition-colors"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-6 gap-4">
                        <div className="col-span-3">
                          <FormField label="Rua">
                            <input
                              type="text"
                              value={address.street}
                              onChange={(e) => handleAddressChange(index, 'street', e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-1 focus:ring-gray-300 transition-all"
                            />
                          </FormField>
                        </div>
                        
                        <FormField label="Número">
                          <input
                            type="text"
                            value={address.number}
                            onChange={(e) => handleAddressChange(index, 'number', e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-1 focus:ring-gray-300 transition-all"
                          />
                        </FormField>
                        
                        <div className="col-span-2">
                          <FormField label="Complemento">
                            <input
                              type="text"
                              value={address.complement}
                              onChange={(e) => handleAddressChange(index, 'complement', e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-1 focus:ring-gray-300 transition-all"
                            />
                          </FormField>
                        </div>
                        
                        <div className="col-span-2">
                          <FormField label="Bairro">
                            {deliveryFees.length > 0 ? (
                              <select
                                value={address.neighborhood}
                                onChange={(e) => handleAddressChange(index, 'neighborhood', e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-1 focus:ring-gray-300 transition-all"
                              >
                                <option value="">Selecione o bairro</option>
                                {deliveryFees.map(fee => (
                                  <option key={fee.id} value={fee.neighborhood}>
                                    {fee.neighborhood} - {formatCurrency(fee.fee)}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={address.neighborhood}
                                onChange={(e) => handleAddressChange(index, 'neighborhood', e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-1 focus:ring-gray-300 transition-all"
                              />
                            )}
                          </FormField>
                        </div>
                        
                        <div className="col-span-2">
                          <FormField label="Cidade">
                            <input
                              type="text"
                              value={address.city}
                              onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-1 focus:ring-gray-300 transition-all"
                            />
                          </FormField>
                        </div>
                        
                        <div className="col-span-2">
                          <FormField label="CEP">
                            <input
                              type="text"
                              value={address.zipCode}
                              onChange={(e) => handleAddressChange(index, 'zipCode', e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-1 focus:ring-gray-300 transition-all"
                            />
                          </FormField>
                        </div>
                        
                        <div className="col-span-6">
                          <FormField label="Ponto de Referência">
                            <input
                              type="text"
                              value={address.reference}
                              onChange={(e) => handleAddressChange(index, 'reference', e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-1 focus:ring-gray-300 transition-all"
                              placeholder="Próximo ao supermercado, em frente à praça..."
                            />
                          </FormField>
                        </div>
                        
                        {address.deliveryFee > 0 && (
                          <div className="col-span-6">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
                              <CheckCircle2 className="text-green-600" size={20} />
                              <div>
                                <p className="font-medium text-green-800">Taxa de entrega: {formatCurrency(address.deliveryFee)}</p>
                                <p className="text-green-600 text-sm">Calculada automaticamente para {address.neighborhood}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {customerData.isNewCustomer ? 'Criar Cliente Global' : 'Cadastrar Endereços'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};