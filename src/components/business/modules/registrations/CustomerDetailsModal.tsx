import React, { useState, useEffect, useMemo } from 'react';
import {
  User, Phone, Mail, MapPin, Calendar, TrendingUp, ShoppingCart,
  Clock, Star, Gift, MessageSquare, Percent, X, Save, Edit3,
  Pizza, Coffee, IceCream, Award, Target, BarChart3, Crown,
  Plus, Minus, AlertTriangle, CheckCircle, Zap, DollarSign,
  Globe, Building, Eye, EyeOff, PlusCircle, Trash2,
  Ticket, Loader // --- Adicionado Ticket e Loader ---
} from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, addDoc, serverTimestamp, writeBatch, deleteDoc } from 'firebase/firestore';
// --- Adicionado 'functions' e 'httpsCallable' ---
import { db, functions } from '../../../../config/firebase';
import { httpsCallable } from 'firebase/functions';
// --- Fim da Adição ---
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Modal } from '../../../ui/Modal';
import { FormField } from '../../../ui/FormField';
import { useUI } from '../../../../contexts/UIContext';
import { formatCurrency, formatDate, formatPhoneNumber } from '../../../../utils/formatters';

// --- NOVA CLOUD FUNCTION (LOCAL) ---
const generateLocalLotteryCode = httpsCallable(functions, 'generateLocalLotteryCode');

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  const { showAlert } = useUI();
  const { businessId, orders, products, loyaltyTransactions, loyaltyRewards, loyaltySettings, deliveryFees } = useBusiness();

  // A NOVA ABA "DADOS DO CLIENTE" É A PRIMEIRA E PADRÃO
  const [activeTab, setActiveTab] = useState('dados');
  const [loading, setLoading] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [customerAddresses, setCustomerAddresses] = useState<any[]>([]);
  const [pointsToAdd, setPointsToAdd] = useState(0);
  const [pointsToRemove, setPointsToRemove] = useState(0);

  // ESTADOS PARA CONTROLE DE EDIÇÃO
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({ ...customer, broadcastLists: customer.broadcastLists || [] });

  // DADOS MOCADOS: No futuro, viriam do Firestore
  const availableLists = [
    { id: '1', title: 'Promoções da Semana 🍕' },
    { id: '2', title: 'Novidades do Cardápio ✨' },
    { id: '3', title: 'Clientes VIP 👑' }
  ];

  // Buscar pedidos e endereços do cliente em tempo real
  useEffect(() => {
    if (!customer?.id || !businessId) return;

    // Reseta o estado de edição quando o cliente muda
    setFormData({ 
      ...customer, 
      addresses: [], 
      birthDate: customer.birthDate || '', // Garante que não seja undefined
      broadcastLists: customer.broadcastLists || [],
      // --- Adicionado para garantir que o form tenha os dados mais recentes ---
      wantsToParticipateInDraws: customer.wantsToParticipateInDraws || false,
      lotteryCode: customer.lotteryCode || null
    });
    setIsEditing(false);

    // Listener para Pedidos
    const ordersQuery = query(
      collection(db, 'orders'),
      where('businessId', '==', businessId),
      where('customerId', '==', customer.id) // DEVE SER localCustomerId
    );

    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(doc.data().date)
      }));
      setCustomerOrders(orders.sort((a, b) => b.createdAt - a.createdAt));
    });

    // Listener para Endereços
    const addressesQuery = query(
      collection(db, 'users', businessId, 'customerAddresses'),
      where('localCustomerId', '==', customer.id)
    );

    const unsubAddresses = onSnapshot(addressesQuery, (snapshot) => {
      const addressesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomerAddresses(addressesData);
      setFormData((prev: any) => ({ ...prev, addresses: addressesData }));
    });

    // --- NOVO: Listener para o PRÓPRIO cliente local ---
    // Isso garante que se o código for gerado, ele apareça em tempo real
    const localCustomerRef = doc(db, 'users', businessId, 'localCustomers', customer.id);
    const unsubCustomer = onSnapshot(localCustomerRef, (docSnap) => {
        if (docSnap.exists()) {
            const updatedCustomerData = docSnap.data();
            setFormData((prev: any) => ({
                ...prev,
                ...updatedCustomerData
            }));
        }
    });

    return () => {
      unsubOrders();
      unsubAddresses();
      unsubCustomer(); // Limpa o novo listener
    };
  }, [customer, businessId]);

  // Análise completa do cliente com dados reais
  const customerAnalytics = useMemo(() => {
    if (customerOrders.length === 0) {
      return {
        totalSpent: 0,
        orderCount: 0,
        avgOrderValue: 0,
        lastOrderDate: null,
        favoriteProducts: [],
        frequencyScore: 0,
        loyaltyLevel: 'Bronze',
        preferredCategories: [],
        daysSinceLastOrder: null,
        loyaltyPoints: customer?.loyaltyPoints || 0,
        purchaseFrequency: 0,
        avgDaysBetweenOrders: 0,
        preferredOrderTime: 'Noite',
        riskLevel: 'Baixo'
      };
    }

    const totalSpent = customerOrders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount || 0), 0);
    const orderCount = customerOrders.length;
    const avgOrderValue = totalSpent / orderCount;
    const lastOrderDate = customerOrders[0]?.createdAt;

    const daysSinceLastOrder = lastOrderDate ? Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

    // Calcular dias médios entre pedidos
    let avgDaysBetweenOrders = 0;
    if (customerOrders.length > 1) {
      const orderDates = customerOrders.map(o => o.createdAt).sort((a, b) => a - b);
      const intervals = [];
      for (let i = 1; i < orderDates.length; i++) {
        const daysDiff = Math.floor((orderDates[i] - orderDates[i - 1]) / (1000 * 60 * 60 * 24));
        intervals.push(daysDiff);
      }
      avgDaysBetweenOrders = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    }

    // Análise de horário preferido
    const hourCounts = customerOrders.reduce((acc, order) => {
      const hour = order.createdAt.getHours();
      if (hour >= 6 && hour < 12) acc.manha++;
      else if (hour >= 12 && hour < 18) acc.tarde++;
      else acc.noite++;
      return acc;
    }, { manha: 0, tarde: 0, noite: 0 });

    const preferredOrderTime = Object.entries(hourCounts).reduce((a, b) => hourCounts[a[0]] > hourCounts[b[0]] ? a : b)[0];
    const preferredOrderTimeLabel = preferredOrderTime === 'manha' ? 'Manhã' : preferredOrderTime === 'tarde' ? 'Tarde' : 'Noite';

    // Análise de produtos favoritos
    const productFrequency = customerOrders
      .flatMap(order => order.items || [])
      .reduce((acc, item) => {
        const key = item.productId || item.name;
        if (!acc[key]) {
          acc[key] = { name: item.name, count: 0, totalSpent: 0 };
        }
        acc[key].count += item.qty;
        acc[key].totalSpent += item.qty * item.salePrice;
        return acc;
      }, {});

    const favoriteProducts = Object.values(productFrequency)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);

    // Análise de categorias preferidas
    const categoryFrequency = customerOrders
      .flatMap(order => order.items || [])
      .reduce((acc, item) => {
        const product = products.find(p => p.id === item.productId);
        const category = product?.category || 'Outros';
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += item.qty;
        return acc;
      }, {});

    const totalItems = Object.values(categoryFrequency).reduce((sum: number, count) => sum + (count as number), 0);
    const preferredCategories = Object.entries(categoryFrequency)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count as number / totalItems) * 100)
      }));

    // Score de frequência (0-100)
    let frequencyScore = 0;

    if (orderCount >= 20) frequencyScore += 40;
    else if (orderCount >= 10) frequencyScore += 30;
    else if (orderCount >= 5) frequencyScore += 20;
    else if (orderCount >= 2) frequencyScore += 10;

    if (daysSinceLastOrder !== null) {
      if (daysSinceLastOrder <= 7) frequencyScore += 30;
      else if (daysSinceLastOrder <= 30) frequencyScore += 20;
      else if (daysSinceLastOrder <= 90) frequencyScore += 10;
    }

    if (avgOrderValue >= 100) frequencyScore += 20;
    else if (avgOrderValue >= 50) frequencyScore += 15;
    else if (avgOrderValue >= 30) frequencyScore += 10;

    if (totalSpent >= 1000) frequencyScore += 10;
    else if (totalSpent >= 500) frequencyScore += 5;

    // Nível de fidelidade baseado no score
    let loyaltyLevel = 'Bronze';
    if (frequencyScore >= 90) loyaltyLevel = 'Diamante';
    else if (frequencyScore >= 70) loyaltyLevel = 'Ouro';
    else if (frequencyScore >= 50) loyaltyLevel = 'Prata';

    // Calcular pontos de fidelidade baseado no gasto total
    const pointsPerReal = loyaltySettings?.pointsPerReal || 1;
    const loyaltyPoints = Math.floor(totalSpent * pointsPerReal);

    // Frequência de compra (pedidos por mês)
    const firstOrderDate = customerOrders[customerOrders.length - 1]?.createdAt;
    const monthsSinceFirstOrder = firstOrderDate ?
      Math.max(1, Math.floor((Date.now() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24 * 30))) : 1;
    const purchaseFrequency = orderCount / monthsSinceFirstOrder;

    // Nível de risco de inatividade
    let riskLevel = 'Baixo';
    if (daysSinceLastOrder > 90) riskLevel = 'Alto';
    else if (daysSinceLastOrder > 30) riskLevel = 'Médio';

    return {
      totalSpent,
      orderCount,
      avgOrderValue,
      lastOrderDate,
      favoriteProducts,
      frequencyScore,
      loyaltyLevel,
      preferredCategories,
      daysSinceLastOrder,
      loyaltyPoints,
      purchaseFrequency,
      avgDaysBetweenOrders,
      preferredOrderTime: preferredOrderTimeLabel,
      riskLevel
    };
  }, [customerOrders, products, loyaltySettings, customer]);

  const customerLoyaltyTransactions = useMemo(() => {
    return loyaltyTransactions.filter(t => t.customerId === customer.id);
  }, [loyaltyTransactions, customer.id]);

  // FUNÇÕES PARA O NOVO MODO DE EDIÇÃO
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // --- NOVO: Handler para o checkbox de participação ---
  const handleParticipationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setFormData((prev: any) => ({ ...prev, wantsToParticipateInDraws: checked }));
    
    // Se o usuário está desmarcando, remove o código e salva
    if (!checked) {
        showConfirmation("Desmarcar esta opção removerá o número da sorte do cliente. Deseja continuar?", 
            () => {
                setFormData((prev: any) => ({ ...prev, lotteryCode: null, wantsToParticipateInDraws: false }));
                // Salva imediatamente a remoção
                handleSaveChanges(false); // Passa false para não fechar o modo de edição
            },
            () => {
                // Se cancelar, reverte o checkbox
                setFormData((prev: any) => ({ ...prev, wantsToParticipateInDraws: true }));
            }
        );
    }
  };

  const handleAddressChange = (index: number, field: string, value: string) => {
    const newAddresses = [...formData.addresses];
    newAddresses[index] = { ...newAddresses[index], [field]: value };
    setFormData((prev: any) => ({ ...prev, addresses: newAddresses }));
  };

  const addAddress = () => {
    setFormData((prev: any) => ({
      ...prev,
      addresses: [...prev.addresses, {
        label: `Endereço ${prev.addresses.length + 1}`,
        street: '',
        number: '',
        neighborhood: '',
        city: 'MARACANAÚ',
        isNew: true
      }]
    }));
  };

  const removeAddress = (index: number) => {
    const newAddresses = formData.addresses.filter((_: any, i: number) => i !== index);
    setFormData((prev: any) => ({ ...prev, addresses: newAddresses }));
  };

  const handleBroadcastListToggle = (listId: string) => {
    setFormData((prev: any) => {
      const currentLists = prev.broadcastLists || [];
      if (currentLists.includes(listId)) {
        return { ...prev, broadcastLists: currentLists.filter((id: string) => id !== listId) };
      } else {
        return { ...prev, broadcastLists: [...currentLists, listId] };
      }
    });
  };

  // --- ATUALIZADO: handleSaveChanges agora tem um parâmetro opcional ---
  const handleSaveChanges = async (exitEditMode = true) => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      const customerRef = doc(db, 'users', businessId, 'localCustomers', customer.id);
      
      // ✅ CORREÇÃO: Prepara os dados para atualização, tratando valores indefinidos
      const dataToUpdate = {
        name: formData.name,
        email: formData.email || null, // Garante que email vazio vire null
        phone: formData.phone,
        notes: formData.notes || '',
        broadcastLists: formData.broadcastLists || [],
        // Se birthDate for uma string vazia, salva como null. Senão, salva o valor.
        birthDate: formData.birthDate || null, 
        // --- Campos do Sorteio Salvos ---
        wantsToParticipateInDraws: formData.wantsToParticipateInDraws || false,
        lotteryCode: formData.lotteryCode || null,
        updatedAt: serverTimestamp()
      };
      
      batch.update(customerRef, dataToUpdate);

      // Processa os endereços (se estiver no modo de edição)
      if (isEditing) {
          for (const address of formData.addresses) {
            if (address.id && !address.isNew) { // Atualiza endereço existente
              const addressRef = doc(db, 'users', businessId, 'customerAddresses', address.id);
              batch.update(addressRef, {
                label: address.label,
                street: address.street,
                number: address.number,
                complement: address.complement || '',
                neighborhood: address.neighborhood,
                city: address.city,
                reference: address.reference || '',
              });
            } else if (address.isNew) { // Cria novo endereço
              const newAddressRef = doc(collection(db, 'users', businessId, 'customerAddresses'));
              batch.set(newAddressRef, {
                localCustomerId: customer.id,
                globalCustomerId: customer.globalCustomerId || null,
                ...address
              });
            }
          }

          // Deleta endereços que foram removidos do formulário
          customerAddresses.forEach(originalAddress => {
            if (!formData.addresses.find((formAddress: any) => formAddress.id === originalAddress.id)) {
              const addressToDeleteRef = doc(db, 'users', businessId, 'customerAddresses', originalAddress.id);
              batch.delete(addressToDeleteRef);
            }
          });
      }

      await batch.commit();

      showAlert("Dados do cliente atualizados com sucesso!", "success");
      if (exitEditMode) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      showAlert("Erro ao salvar alterações.", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- NOVO: Função para chamar a Cloud Function local ---
  const handleGenerateLocalCode = async () => {
    setLoading(true);
    showAlert("Gerando código da sorte local...", "info");
    try {
        const result = await generateLocalLotteryCode({
            businessId: businessId,
            localCustomerId: customer.id
        });
        
        // O listener onSnapshot no useEffect vai atualizar a UI automaticamente
        // Mas podemos forçar uma atualização local para feedback imediato
        // @ts-ignore
        if (result.data.success) {
            // @ts-ignore
            setFormData((prev: any) => ({ ...prev, lotteryCode: result.data.lotteryCode, wantsToParticipateInDraws: true }));
            showAlert("Número da sorte gerado para este cliente!", "success");
        } else {
            // @ts-ignore
            throw new Error(result.data.message || "Função falhou sem mensagem");
        }
    } catch (error: any) {
        console.error("Erro ao gerar código local:", error);
        showAlert(error.message || "Erro ao gerar código.", "error");
    } finally {
        setLoading(false);
    }
  }

  const handleCancelEdit = () => {
    setFormData({ ...customer, addresses: customerAddresses, broadcastLists: customer.broadcastLists || [] });
    setIsEditing(false);
  };

  const handleAddPoints = async () => {
    if (pointsToAdd <= 0) {
      showAlert('Digite um valor válido de pontos', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'loyaltyTransactions'), {
        customerId: customer.id,
        businessId,
        type: 'bonus',
        points: pointsToAdd,
        description: 'Pontos adicionados manualmente',
        createdAt: serverTimestamp()
      });

      const customerRef = doc(db, 'users', businessId, 'localCustomers', customer.id);
      await updateDoc(customerRef, {
        loyaltyPoints: (customerAnalytics.loyaltyPoints || 0) + pointsToAdd,
        updatedAt: serverTimestamp()
      });

      showAlert(`${pointsToAdd} pontos adicionados com sucesso!`, 'success');
      setPointsToAdd(0);
    } catch (error) {
      console.error('Erro ao adicionar pontos:', error);
      showAlert('Erro ao adicionar pontos', 'error');
    }
  };

  const handleRemovePoints = async () => {
    if (pointsToRemove <= 0) {
      showAlert('Digite um valor válido de pontos', 'error');
      return;
    }

    if (pointsToRemove > customerAnalytics.loyaltyPoints) {
      showAlert('Não é possível remover mais pontos do que o cliente possui', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'loyaltyTransactions'), {
        customerId: customer.id,
        businessId,
        type: 'penalty',
        points: -pointsToRemove,
        description: 'Pontos removidos manualmente',
        createdAt: serverTimestamp()
      });

      const customerRef = doc(db, 'users', businessId, 'localCustomers', customer.id);
      await updateDoc(customerRef, {
        loyaltyPoints: Math.max(0, (customerAnalytics.loyaltyPoints || 0) - pointsToRemove),
        updatedAt: serverTimestamp()
      });

      showAlert(`${pointsToRemove} pontos removidos com sucesso!`, 'success');
      setPointsToRemove(0);
    } catch (error) {
      console.error('Erro ao remover pontos:', error);
      showAlert('Erro ao remover pontos', 'error');
    }
  };

  const handleRedeemReward = async (reward: any) => {
    if (customerAnalytics.loyaltyPoints < reward.pointsRequired) {
      showAlert('Cliente não possui pontos suficientes', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'loyaltyTransactions'), {
        customerId: customer.id,
        businessId,
        type: 'redeemed',
        points: -reward.pointsRequired,
        description: `Resgate: ${reward.title}`,
        rewardId: reward.id,
        createdAt: serverTimestamp()
      });

      const customerRef = doc(db, 'users', businessId, 'localCustomers', customer.id);
      await updateDoc(customerRef, {
        loyaltyPoints: customerAnalytics.loyaltyPoints - reward.pointsRequired,
        updatedAt: serverTimestamp()
      });

      showAlert(`Recompensa "${reward.title}" resgatada com sucesso!`, 'success');
    } catch (error) {
      console.error('Erro ao resgatar recompensa:', error);
      showAlert('Erro ao resgatar recompensa', 'error');
    }
  };

  const tabs = [
    { id: 'dados', label: 'Dados do Cliente', icon: <User size={16} /> }, // NOVA ABA
    { id: 'analise', label: 'Análise de Dados', icon: <BarChart3 size={16} /> },
    { id: 'fidelidade', label: 'Programa de Fidelidade', icon: <Star size={16} /> },
    { id: 'historico', label: 'Histórico de Pedidos', icon: <Clock size={16} /> }
  ];

  const getLoyaltyColor = (level: string) => {
    switch (level) {
      case 'Diamante': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'Ouro': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Prata': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'Bronze': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getLoyaltyIcon = (level: string) => {
    switch (level) {
      case 'Diamante': return <Crown className="text-purple-600" size={20} />;
      case 'Ouro': return <Award className="text-yellow-600" size={20} />;
      case 'Prata': return <Star className="text-gray-600" size={20} />;
      case 'Bronze': return <Target className="text-orange-600" size={20} />;
      default: return <User className="text-blue-600" size={20} />;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      // RENDERIZAÇÃO DA NOVA ABA DE DADOS DO CLIENTE COM ENDEREÇOS
      case 'dados':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Informações Cadastrais
              </h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Edit3 size={16} />
                  Editar Dados
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    <X size={16} />
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSaveChanges(true)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <Save size={16} />
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Nome Completo">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  readOnly={!isEditing}
                  className={`w-full p-3 border rounded-lg ${!isEditing ? 'bg-gray-100' : 'bg-white'}`}
                />
              </FormField>

              <FormField label="Telefone / WhatsApp">
                <input
                  name="phone"
                  value={formatPhoneNumber(formData.phone)}
                  onChange={handleFormChange}
                  readOnly={!isEditing}
                  className={`w-full p-3 border rounded-lg ${!isEditing ? 'bg-gray-100' : 'bg-white'}`}
                />
              </FormField>

              <FormField label="E-mail">
                <input
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleFormChange}
                  readOnly={!isEditing}
                  className={`w-full p-3 border rounded-lg ${!isEditing ? 'bg-gray-100' : 'bg-white'}`}
                />
              </FormField>

              <FormField label="Data de Aniversário">
                <input
                  name="birthDate"
                  type="date"
                  value={formData.birthDate || ''}
                  onChange={handleFormChange}
                  readOnly={!isEditing}
                  className={`w-full p-3 border rounded-lg ${!isEditing ? 'bg-gray-100' : 'bg-white'}`}
                />
              </FormField>

              <div className="md:col-span-2">
                <FormField label="Observações sobre o cliente">
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleFormChange}
                    readOnly={!isEditing}
                    rows={3}
                    className={`w-full p-3 border rounded-lg ${!isEditing ? 'bg-gray-100' : 'bg-white'}`}
                  />
                </FormField>
              </div>
            </div>

            {/* NOVA SEÇÃO: LISTAS DE TRANSMISSÃO */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <MessageSquare size={20} /> Listas de Transmissão
                </h3>
              </div>
              <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                {availableLists.map(list => (
                  <label key={list.id} className="flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-gray-700">{list.title}</span>
                    <input
                      type="checkbox"
                      checked={formData.broadcastLists?.includes(list.id)}
                      onChange={() => handleBroadcastListToggle(list.id)}
                      disabled={!isEditing}
                      className="h-5 w-5 rounded text-blue-600 border-gray-300 focus:ring-blue-500 disabled:bg-gray-200"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* --- SEÇÃO SHOW DO COMILHÃO (LOCAL) --- */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg shadow-inner border border-purple-200">
                <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
                    <Ticket size={24} className="text-purple-600" />
                    Show do Comilhão (Controle Local)
                </h2>
                
                {formData.lotteryCode ? (
                    // 1. Cliente já tem código
                    <div className="p-4 bg-white border border-green-300 rounded-lg text-center">
                        <p className="text-sm text-green-700">Número da sorte do cliente neste estabelecimento:</p>
                        <p className="text-4xl font-bold text-green-600 tracking-widest my-2">
                            {formData.lotteryCode}
                        </p>
                        {isEditing && (
                            <label className="flex items-center gap-3 cursor-pointer mt-4">
                                <input
                                type="checkbox"
                                name="wantsToParticipateInDraws"
                                checked={formData.wantsToParticipateInDraws}
                                onChange={handleParticipationChange}
                                className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                disabled={loading}
                                />
                                <span className="text-gray-700 font-medium">
                                Manter participação ativa
                                </span>
                            </label>
                        )}
                    </div>
                ) : (
                    // 2. Cliente não tem código
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">Este cliente ainda não participa do sorteio neste estabelecimento.</p>
                        <button
                            type="button"
                            onClick={handleGenerateLocalCode}
                            disabled={loading || isEditing}
                            className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400"
                        >
                            {loading ? <Loader size={20} className="animate-spin" /> : 'Adicionar ao Sorteio'}
                        </button>
                        {isEditing && (
                             <p className="text-xs text-gray-500 mt-2">Salve as outras alterações antes de gerar um código.</p>
                        )}
                    </div>
                )}
            </div>

            {/* SEÇÃO DE ENDEREÇOS - NOVA FUNCIONALIDADE */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Endereços Cadastrados</h3>
                {isEditing && (
                  <button
                    onClick={addAddress}
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <PlusCircle size={16} />
                    Adicionar Endereço
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {formData.addresses?.map((addr: any, index: number) => (
                  <div key={addr.id || index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <FormField label="Rótulo">
                        <input
                          value={addr.label}
                          onChange={(e) => handleAddressChange(index, 'label', e.target.value)}
                          readOnly={!isEditing}
                          className={`w-full p-2 border rounded-lg ${!isEditing ? 'bg-gray-100' : 'bg-white'}`}
                        />
                      </FormField>

                      <FormField label="Bairro">
                        {isEditing ? (
                          <select 
                            value={addr.neighborhood} 
                            onChange={(e) => handleAddressChange(index, 'neighborhood', e.target.value)} 
                            className="w-full p-2 border rounded-lg bg-white"
                          >
                            <option value="">Selecione...</option>
                            {deliveryFees.map(fee => (
                              <option key={fee.id} value={fee.neighborhood}>{fee.neighborhood}</option>
                            ))}
                          </select>
                        ) : (
                          <input value={addr.neighborhood} readOnly className="w-full p-2 border rounded-lg bg-gray-100" />
                        )}
                      </FormField>

                      <FormField label="Rua">
                        <input
                          value={addr.street}
                          onChange={(e) => handleAddressChange(index, 'street', e.target.value)}
                          readOnly={!isEditing}
                          className={`w-full p-2 border rounded-lg ${!isEditing ? 'bg-gray-100' : 'bg-white'}`}
                        />
                      </FormField>

                      <FormField label="Número">
                        <input
                          value={addr.number}
                          onChange={(e) => handleAddressChange(index, 'number', e.target.value)}
                          readOnly={!isEditing}
                          className={`w-full p-2 border rounded-lg ${!isEditing ? 'bg-gray-100' : 'bg-white'}`}
                        />
                      </FormField>

                      <FormField label="Cidade">
                        <input
                          value={addr.city || 'MARACANAÚ'}
                          onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
                          readOnly={!isEditing}
                          className={`w-full p-2 border rounded-lg ${!isEditing ? 'bg-gray-100' : 'bg-white'}`}
                        />
                      </FormField>

                      <FormField label="Complemento">
                        <input
                          value={addr.complement || ''}
                          onChange={(e) => handleAddressChange(index, 'complement', e.target.value)}
                          readOnly={!isEditing}
                          className={`w-full p-2 border rounded-lg ${!isEditing ? 'bg-gray-100' : 'bg-white'}`}
                        />
                      </FormField>
                    </div>

                    {isEditing && (
                      <button
                        onClick={() => removeAddress(index)}
                        type="button"
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        <Trash2 size={14} />
                        Remover Endereço
                      </button>
                    )}
                  </div>
                ))}

                {(!formData.addresses || formData.addresses.length === 0) && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <MapPin size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Nenhum endereço cadastrado</p>
                    {isEditing && (
                      <button
                        onClick={addAddress}
                        type="button"
                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Clique aqui para adicionar o primeiro endereço
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'analise':
        return (
          <div className="space-y-8">
            {/* Header da Análise */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Análise Comportamental</h3>
              <p className="text-blue-700 text-sm">
                Dados baseados em {customerAnalytics.orderCount} pedidos reais e {formatCurrency(customerAnalytics.totalSpent)} em compras.
              </p>
            </div>

            {/* Métricas Principais */}
            <div className="grid grid-cols-3 gap-8">
              {/* Score do Cliente */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="#E5E7EB"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="#3B82F6"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(customerAnalytics.frequencyScore / 100) * 314} 314`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-light text-gray-900">{customerAnalytics.frequencyScore}</span>
                    <span className="text-xs text-gray-500">/ 100</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">Score do Cliente</p>
                  <div className={`text-sm px-3 py-1 rounded-full inline-flex items-center gap-2 border ${getLoyaltyColor(customerAnalytics.loyaltyLevel)}`}>
                    {getLoyaltyIcon(customerAnalytics.loyaltyLevel)}
                    Nível {customerAnalytics.loyaltyLevel}
                  </div>
                </div>
              </div>

              {/* Insights de Consumo */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="text-blue-500" size={20} />
                  <span className="font-medium text-gray-700">Insights de Consumo</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Pizza className="text-orange-500" size={16} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Preferência por {customerAnalytics.preferredCategories[0]?.category || 'Produtos'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {customerAnalytics.preferredCategories[0]?.percentage || 0}% dos pedidos
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="text-purple-500" size={16} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Compra {customerAnalytics.preferredOrderTime}</p>
                      <p className="text-xs text-gray-500">Horário preferido para pedidos</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-green-500" size={16} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {customerAnalytics.avgOrderValue >= 50 ? 'Ticket Médio Alto' : 'Ticket Médio Normal'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(customerAnalytics.avgOrderValue)} por pedido
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`${customerAnalytics.riskLevel === 'Alto' ? 'text-red-500' : customerAnalytics.riskLevel === 'Médio' ? 'text-yellow-500' : 'text-green-500'}`} size={16} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Risco: {customerAnalytics.riskLevel}</p>
                      <p className="text-xs text-gray-500">
                        {customerAnalytics.daysSinceLastOrder ? `${customerAnalytics.daysSinceLastOrder} dias sem pedidos` : 'Cliente ativo'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados Financeiros */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="text-green-500" size={20} />
                  <span className="font-medium text-gray-700">Dados Financeiros</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Gasto</p>
                    <p className="text-2xl font-light text-gray-900">{formatCurrency(customerAnalytics.totalSpent)}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ticket Médio</p>
                    <p className="text-2xl font-light text-gray-900">{formatCurrency(customerAnalytics.avgOrderValue)}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Frequência</p>
                    <p className="text-2xl font-light text-gray-900">{customerAnalytics.purchaseFrequency.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">pedidos/mês</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Produtos Favoritos */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="text-green-500" size={20} />
                <span className="font-medium text-gray-900">Produtos Favoritos</span>
              </div>

              <div className="space-y-4">
                {customerAnalytics.favoriteProducts.map((product: any, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      <p className="text-xs text-gray-500">{product.count} pedidos • {formatCurrency(product.totalSpent)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (product.count / customerAnalytics.orderCount) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{Math.round((product.count / customerAnalytics.orderCount) * 100)}%</span>
                    </div>
                  </div>
                ))}

                {customerAnalytics.favoriteProducts.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum produto favorito identificado ainda
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'fidelidade':
        return (
          <div className="space-y-8">
            {/* Status de Fidelidade */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-medium text-gray-900">Status de Fidelidade</h4>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Pontos Atuais</p>
                    <p className="text-2xl font-bold text-gray-900">{customerAnalytics.loyaltyPoints}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Bronze (0)</span>
                  <span>Prata (100)</span>
                  <span>Ouro (250)</span>
                  <span>Diamante (500)</span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-orange-500 via-gray-500 via-yellow-500 to-purple-500 h-3 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, (customerAnalytics.loyaltyPoints / 500) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getLoyaltyColor(customerAnalytics.loyaltyLevel)}`}>
                {getLoyaltyIcon(customerAnalytics.loyaltyLevel)}
                <span className="font-medium">Nível {customerAnalytics.loyaltyLevel}</span>
              </div>
            </div>

            {/* Gerenciar Pontos */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Star className="text-yellow-500" size={20} />
                <span className="font-medium text-gray-900">Gerenciar Pontos</span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-700 mb-2">Adicionar Pontos</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Quantidade"
                      value={pointsToAdd || ''}
                      onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    />
                    <button
                      onClick={handleAddPoints}
                      disabled={pointsToAdd <= 0}
                      className="bg-green-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-600 disabled:bg-gray-300 transition"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-700 mb-2">Remover Pontos</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Quantidade"
                      value={pointsToRemove || ''}
                      onChange={(e) => setPointsToRemove(parseInt(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    />
                    <button
                      onClick={handleRemovePoints}
                      disabled={pointsToRemove <= 0}
                      className="bg-red-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-600 disabled:bg-gray-300 transition"
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Regras de Pontuação */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                <h5 className="font-medium text-yellow-800 mb-2">Regras de Pontuação</h5>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• R$ 1,00 = {loyaltySettings?.pointsPerReal || 1} ponto</li>
                  <li>• Bônus de aniversário: {loyaltySettings?.bonusRules?.birthdayBonus || 50} pontos</li>
                  <li>• Pontos calculados automaticamente nas vendas</li>
                </ul>
              </div>
            </div>

            {/* Recompensas Disponíveis */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Gift className="text-purple-500" size={20} />
                <span className="font-medium text-gray-900">Recompensas Disponíveis</span>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {loyaltyRewards.map(reward => {
                  const canRedeem = customerAnalytics.loyaltyPoints >= reward.pointsRequired;

                  return (
                    <div key={reward.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{reward.title}</h5>
                          <p className="text-xs text-gray-500">{reward.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-purple-600">{reward.pointsRequired} pts</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRedeemReward(reward)}
                        disabled={!canRedeem}
                        className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition ${canRedeem
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        {canRedeem ? 'Resgatar' : 'Pontos Insuficientes'}
                      </button>
                    </div>
                  );
                })}

                {loyaltyRewards.length === 0 && (
                  <div className="text-center py-8">
                    <Gift size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Nenhuma recompensa configurada</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'historico':
        return (
          <div className="space-y-6">
            {/* Histórico de Pedidos */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <ShoppingCart className="text-blue-500" size={20} />
                <span className="font-medium text-gray-900">Histórico de Pedidos ({customerOrders.length})</span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {customerOrders.map(order => (
                  <div key={order.id} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium text-gray-900">#{order.id.substring(0, 8)}</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${order.status === 'finished' ? 'bg-green-100 text-green-800' :
                            order.status === 'processing' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                          }`}>
                          {order.status === 'finished' ? 'Finalizado' :
                            order.status === 'processing' ? 'Processando' : 'Aberto'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(order.createdAt)} • {order.items?.length || 0} itens
                      </p>
                      {order.items && order.items.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          {order.items.slice(0, 2).map((item: { name: any; }) => item.name).join(', ')}
                          {order.items.length > 2 && ` +${order.items.length - 2} itens`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-lg">
                        {formatCurrency(order.finalAmount || order.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.origin === 'delivery' ? 'Delivery' : 'Balcão'}
                      </p>
                    </div>
                  </div>
                ))}

                {customerOrders.length === 0 && (
                  <div className="text-center py-8">
                    <ShoppingCart size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Nenhum pedido realizado ainda</p>
                  </div>
                )}
              </div>
            </div>

            {/* Histórico de Fidelidade */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="text-purple-500" size={20} />
                <span className="font-medium text-gray-900">Histórico de Pontos</span>
              </div>

              <div className="space-y-3 max-h-48 overflow-y-auto">
                {customerLoyaltyTransactions.map(transaction => (
                  <div key={transaction.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(transaction.createdAt?.toDate?.() || transaction.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.points > 0 ? '+' : ''}{transaction.points} pontos
                      </p>
                    </div>
                  </div>
                ))}

                {customerLoyaltyTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <Clock size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Nenhuma movimentação de pontos</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalhes do Cliente: ${customer.name}`}
      size="5xl"
    >
      <div className="h-[80vh] flex flex-col">
        {/* Header com informações do cliente */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{customer.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-600">{formatPhoneNumber(customer.phone)}</span>
                  {customer.globalCustomerId && (
                    <div className="flex items-center gap-1">
                      <Globe size={12} className="text-green-500" />
                      <span className="text-xs text-green-600 font-medium">Cliente Global</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(customerAnalytics.totalSpent)}</p>
              <p className="text-sm text-gray-500">{customerAnalytics.orderCount} pedidos realizados</p>
            </div>
          </div>
        </div>

        {/* Tabs - Agora com a nova aba */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 text-white hover:bg-gray-700 transition-colors rounded-lg"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};