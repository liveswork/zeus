// src/components/business/modules/DeliveryManager.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle, ChevronsLeft, Clock, MapPin, Edit, CheckCircle,
  XCircle, Phone, User, Search, Plus, Minus, ShoppingCart,
  Sparkles, MessageSquare, Bike, X, Printer, Trash2, DollarSign, CreditCard
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp, getDocs, collection, query, where, limit, deleteDoc } from 'firebase/firestore';
import { db, functions } from '../../../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { useBusiness } from '../../../contexts/BusinessContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useUI } from '../../../contexts/UIContext';
import { formatCurrency, formatPhoneNumber, normalizePhoneNumber } from '../../../utils/formatters';
import { usePrintManager } from '../../../hooks/usePrintManager';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../../ui/Modal';

// Modais do Fluxo
import { CustomerSearchModal } from './delivery/CustomerSearchModal';
import { CustomerRegistrationModal } from './delivery/CustomerRegistrationModal';
import { OrderCreationModal } from './delivery/OrderCreationModal';
import { DeliveryPaymentModal } from './delivery/DeliveryPaymentModal';

// =============================================================================
// SISTEMA DE CORES PARA PEDIDOS - FUNÇÕES ADICIONADAS
// =============================================================================

/**
 * Determina a cor da borda lateral baseada no tempo e status do pedido
 */
const getOrderBorderColor = (order: any): string => {
  const now = new Date().getTime();
  const createdAt = order.createdAt?.toDate?.().getTime() || now;
  const minutesElapsed = Math.floor((now - createdAt) / (1000 * 60));

  // Pedidos ativos (cores por tempo)
  if (order.status === 'analise' || order.status === 'preparo' || order.status === 'in_transit') {
    if (minutesElapsed >= 20) {
      return 'border-l-4 border-l-red-600 bg-red-50'; // Muito atrasado: +20min
    } else if (minutesElapsed >= 15) {
      return 'border-l-4 border-l-red-500'; // Crítico: 15-19min
    } else if (minutesElapsed >= 10) {
      return 'border-l-4 border-l-orange-500'; // Alerta: 10-14min
    } else if (minutesElapsed >= 5) {
      return 'border-l-4 border-l-amber-500'; // Atenção: 5-9min
    } else {
      return 'border-l-4 border-l-green-500'; // Normal: 0-4min
    }
  }

  // Pedidos finalizados/cancelados (cores por status)
  switch (order.status) {
    case 'finished':
      return 'border-l-4 border-l-blue-500'; // Finalizado - Azul
    case 'canceled':
      return 'border-l-4 border-l-gray-400'; // Cancelado - Cinza
    default:
      return 'border-l-4 border-l-purple-500'; // Outros status - Roxo
  }
};

/**
 * Retorna informações do tempo para tooltip
 */
const getOrderTimeInfo = (order: any): string => {
  const now = new Date().getTime();
  const createdAt = order.createdAt?.toDate?.().getTime() || now;
  const minutesElapsed = Math.floor((now - createdAt) / (1000 * 60));

  if (order.status === 'finished') {
    return '✅ Pedido finalizado';
  } else if (order.status === 'canceled') {
    return '❌ Pedido cancelado';
  }

  if (minutesElapsed === 0) {
    return '🆕 Pedido recente (menos de 1 minuto)';
  } else if (minutesElapsed === 1) {
    return '⏱️ Pedido há 1 minuto';
  } else if (minutesElapsed >= 20) {
    return `🚨 Pedido há ${minutesElapsed} minutos - Muito atrasado!`;
  } else if (minutesElapsed >= 15) {
    return `⚠️ Pedido há ${minutesElapsed} minutos - Atenção crítica!`;
  } else if (minutesElapsed >= 10) {
    return `🔶 Pedido há ${minutesElapsed} minutos - Necessita atenção`;
  } else if (minutesElapsed >= 5) {
    return `🟡 Pedido há ${minutesElapsed} minutos - Em andamento`;
  } else {
    return `✅ Pedido há ${minutesElapsed} minutos - No prazo`;
  }
};

/**
 * Calcula minutos decorridos para exibição
 */
const getMinutesElapsed = (order: any): number => {
  const now = new Date().getTime();
  const createdAt = order.createdAt?.toDate?.().getTime() || now;
  return Math.floor((now - createdAt) / (1000 * 60));
};

// =============================================================================
// COMPONENTES EXISTENTES (ATUALIZADOS COM O SISTEMA DE CORES)
// =============================================================================

// Componente OrderTimer atualizado para usar cores harmonizadas
const OrderTimer = ({ startTime }: { startTime: any }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const start = startTime?.toDate?.().getTime() || now;
      setSeconds(Math.floor((now - start) / 1000));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;

  // CORREÇÃO: Cores harmonizadas com a paleta laranja
  const getTimerStyle = () => {
    if (minutes >= 10) {
      return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
    } else if (minutes >= 5) {
      return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' };
    } else {
      return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' };
    }
  };

  const style = getTimerStyle();

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${style.bg} ${style.text} ${style.border} font-mono text-sm font-semibold transition-all duration-300`}>
      <Clock size={16} className="flex-shrink-0" />
      <span className="whitespace-nowrap">
        {String(minutes).padStart(2, '0')}:{String(displaySeconds).padStart(2, '0')}
      </span>
    </div>
  );
};

// Componente PaymentInfo (mantido igual)
const PaymentInfo = ({ paymentDetails }: { paymentDetails: any }) => {
  // Defesa contra dados inconsistentes
  if (!paymentDetails || typeof paymentDetails !== 'object') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
        <CreditCard size={14} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-500">
          Pagamento não informado
        </span>
      </div>
    );
  }

  const getPaymentIcon = () => {
    const method = paymentDetails.method || paymentDetails.paymentMethod;

    switch (method) {
      case 'money':
        return <DollarSign size={14} className="text-green-600" />;
      case 'card':
        return <CreditCard size={14} className="text-blue-600" />;
      case 'pix':
        return <Sparkles size={14} className="text-purple-600" />;
      default:
        return <CreditCard size={14} className="text-gray-400" />;
    }
  };

  const getPaymentLabel = () => {
    const method = paymentDetails.method || paymentDetails.paymentMethod;

    switch (method) {
      case 'money':
        return 'Dinheiro';
      case 'card':
        return 'Cartão';
      case 'pix':
        return 'PIX';
      default:
        return method || 'Não informado';
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
      {getPaymentIcon()}
      <span className="text-sm font-medium text-gray-700">
        {getPaymentLabel()}
      </span>
      {paymentDetails.method === 'money' && paymentDetails.needChange && (
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
          Precisa de troco
        </span>
      )}
      {paymentDetails.method === 'money' && paymentDetails.changeFor && (
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
          Troco p/ {formatCurrency(paymentDetails.changeFor)}
        </span>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const statusStyles: { [key: string]: { text: string, bg: string, label: string } } = {
    analise: { text: 'text-blue-800', bg: 'bg-blue-100', label: 'Em Análise' },
    preparo: { text: 'text-orange-800', bg: 'bg-orange-100', label: 'Em Preparo' },
    in_transit: { text: 'text-indigo-800', bg: 'bg-indigo-100', label: 'Em Trânsito' },
    finished: { text: 'text-green-800', bg: 'bg-green-100', label: 'Finalizado' },
    canceled: { text: 'text-red-800', bg: 'bg-red-100', label: 'Cancelado' },
  };

  const style = statusStyles[status] || { text: 'text-gray-800', bg: 'bg-gray-100', label: status };

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
};

const createOrderWithSequentialId = httpsCallable(functions, 'createOrderWithSequentialId');
const finalizeSale = httpsCallable(functions, 'finalizeSale');

export const DeliveryManager: React.FC = () => {
  // Contextos e hooks
  const { orders, products, deliveryFees, businessId, sales } = useBusiness();
  const { userProfile } = useAuth();
  const { showAlert, showConfirmation } = useUI();
  const { printKitchenOrder, printCustomerBill, printDeliveryOrder } = usePrintManager();

  // Estados principais
  const [activeTab, setActiveTab] = useState('preparo');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Estados para fluxo de criação/edição de pedido
  const [currentModal, setCurrentModal] = useState<'search' | 'register' | 'order' | 'payment' | 'edit' | null>(null);
  const [customerData, setCustomerData] = useState<any | null>(null);
  const [customerAddresses, setCustomerAddresses] = useState<any[]>([]);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);

  // Refs para controle do duplo clique
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dados do negócio
  const businessName = userProfile?.businessName || 'Seu Negócio';
  const businessPhone = userProfile?.businessPhone ? formatPhoneNumber(userProfile.businessPhone) : '00000-0000';

  // Lógica de abas
  const workflowTabs = {
    analise: { label: 'Em Análise', orders: orders.filter(o => o.status === 'analise') },
    preparo: { label: 'Em Preparo', orders: orders.filter(o => o.status === 'preparo') },
    transito: { label: 'Em Trânsito', orders: orders.filter(o => o.status === 'in_transit') },
    concluidos: { label: 'Finalizados', orders: sales.filter(s => s.origin === 'delivery' || s.origin === 'balcao') }
  };

  // Detectar se é mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- FUNÇÃO DE DUPLO CLIQUE ---
  const handleOrderClick = (order: any, event: React.MouseEvent) => {
    // Verifica se o pedido pode ser editado
    const canEdit = order.status === 'analise' || order.status === 'preparo';

    if (!canEdit) {
      // Se não pode editar, apenas seleciona o pedido
      setSelectedOrder(order);
      return;
    }

    if (clickTimeoutRef.current) {
      // Segundo clique - duplo clique detectado
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;

      // Abre modal de edição
      handleEditOrder(order);
    } else {
      // Primeiro clique - inicia timeout
      clickTimeoutRef.current = setTimeout(() => {
        // Clique único - apenas seleciona o pedido
        setSelectedOrder(order);
        clickTimeoutRef.current = null;
      }, 300); // Timeout de 300ms para detectar duplo clique
    }
  };

  // --- FUNÇÃO PARA ABRIR EDIÇÃO ---
  const handleEditOrder = (order: any) => {
    if (order.status !== 'analise' && order.status !== 'preparo') {
      showAlert("Este pedido não pode ser editado no status atual.", "warning");
      return;
    }

    setCustomerData({
      displayName: order.customerName,
      phone: order.customerPhone,
      globalId: order.customerId
    });
    setSelectedOrder(order);
    setCurrentModal('edit');
  };

  // --- FUNÇÕES DE AÇÃO PRINCIPAIS ---
  const handleAction = async (action: string, order: any) => {
    if (!order || !order.id) {
      showAlert("Pedido inválido ou não selecionado.", "error");
      return;
    }

    const orderRef = doc(db, 'orders', order.id);

    try {
      switch (action) {
        case 'aceitar':
          await updateDoc(orderRef, {
            status: 'preparo',
            acceptedAt: serverTimestamp()
          });
          showAlert(`Pedido #${order.orderNumber} aceito!`, 'success');
          break;

        case 'enviar':
          if (order.origin === 'delivery') {
            showConfirmation('Deseja imprimir a comanda?',
              async () => {
                // CORREÇÃO: Prepara dados completos para impressão
                const orderForPrint = {
                  ...order,
                  createdAt: order.createdAt?.toDate?.() || new Date(),
                  updatedAt: new Date()
                };
                printDeliveryOrder(orderForPrint);
                await updateDoc(orderRef, {
                  status: 'in_transit',
                  transitAt: serverTimestamp()
                });
                showAlert(`Pedido #${order.orderNumber} saiu para entrega!`, 'success');
              },
              async () => {
                await updateDoc(orderRef, {
                  status: 'in_transit',
                  transitAt: serverTimestamp()
                });
                showAlert(`Pedido #${order.orderNumber} saiu para entrega!`, 'success');
              }
            );
          } else {
            // Para pedidos de balcão, vai direto para finalização
            showConfirmation("Confirmar finalização do pedido?", async () => {
              await finalizeSale({ orderData: order });
              showAlert(`Pedido #${order.orderNumber} finalizado!`, 'success');
              setSelectedOrder(null);
            });
          }
          break;

        case 'finalizar':
          showConfirmation("Confirmar finalização do pedido?", async () => {
            await finalizeSale({ orderData: order });
            showAlert(`Pedido #${order.orderNumber} finalizado!`, 'success');
            setSelectedOrder(null);
          });
          break;

        case 'whatsapp':
          const phone = order.customerPhone || '5585998112283';
          const message = `Olá ${order.customerName}! Seu pedido #${order.orderNumber} está a caminho.`;
          window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
          break;

        case 'reprint':
          // CORREÇÃO: Prepara dados completos para reimpressão
          const orderForReprint = {
            ...order,
            createdAt: order.createdAt?.toDate?.() || new Date(),
            updatedAt: new Date()
          };
          printDeliveryOrder(orderForReprint);
          showAlert(`Comanda do pedido #${order.orderNumber} enviada para impressão.`, 'success');
          break;

        case 'edit':
          handleEditOrder(order);
          break;

        case 'delete':
          showConfirmation(
            "Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.",
            async () => {
              await deleteDoc(orderRef);
              showAlert(`Pedido #${order.orderNumber} excluído com sucesso!`, 'success');
              setSelectedOrder(null);
            }
          );
          break;
      }
    } catch (error: any) {
      showAlert(`Erro ao executar ação: ${error.message}`, 'error');
    }
  };

  // --- FUNÇÕES DE CONTROLE DO FLUXO DE CRIAÇÃO/EDIÇÃO ---
  const handleStartNewOrder = () => {
    setCurrentModal('search');
    setCustomerData(null);
    setCustomerAddresses([]);
    setOrderData(null);
  };

  const handleCustomerFound = async (customer: any) => {
    setCustomerData(customer);

    if (!customer.isNewCustomer && customer.globalId) {
      try {
        const localCustomersQuery = query(
          collection(db, 'users', businessId, 'localCustomers'),
          where('globalCustomerId', '==', customer.globalId),
          limit(1)
        );
        const localCustomersSnapshot = await getDocs(localCustomersQuery);

        if (!localCustomersSnapshot.empty) {
          setIsExistingCustomer(true);

          const addressesQuery = query(
            collection(db, 'users', businessId, 'customerAddresses'),
            where('globalCustomerId', '==', customer.globalId)
          );
          const addressesSnapshot = await getDocs(addressesQuery);
          const addresses = addressesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          if (addresses.length > 0) {
            setCustomerAddresses(addresses);
            setCurrentModal('order');
          } else {
            setCurrentModal('register');
          }
        } else {
          setIsExistingCustomer(false);
          setCurrentModal('register');
        }
      } catch (error) {
        console.error('Erro ao verificar cliente local:', error);
        showAlert('Erro ao verificar dados do cliente', 'error');
      }
    } else {
      setIsExistingCustomer(false);
      setCurrentModal('register');
    }
  };

  const handleCustomerRegistered = (addresses: any) => {
    setCustomerAddresses(addresses);
    setCurrentModal('order');
  };

  const handleOrderCreated = (order: any) => {
    setOrderData(order);
    setCurrentModal('payment');
  };

  // Função unificada para salvar pedido (criação e edição)
  const handleSaveOrder = async (orderDataToSave: any) => {
    try {
      if (orderDataToSave.id) {
        // Modo Edição
        const orderRef = doc(db, 'orders', orderDataToSave.id);
        await updateDoc(orderRef, {
          ...orderDataToSave,
          updatedAt: serverTimestamp(),
        });
        showAlert("Pedido atualizado com sucesso!", "success");
        setCurrentModal(null);
        setSelectedOrder(null);
      } else {
        // Modo Criação - vai para pagamento
        setOrderData(orderDataToSave);
        setCurrentModal('payment');
      }
    } catch (error: any) {
      showAlert(`Erro ao salvar pedido: ${error.message}`, 'error');
    }
  };

const handlePaymentProcessed = async (paymentData: any, updatedOrderData: any) => {
    if (!orderData || !customerData || !businessId) {
      showAlert("Dados essenciais do pedido estão faltando.", "error");
      return;
    }
    if (!paymentData || !paymentData.method) {
      showAlert("Forma de pagamento não selecionada.", "error");
      return;
    }

    if (!updatedOrderData || !customerData || !businessId) {
      showAlert("Dados essenciais do pedido estão faltando.", "error");
      return;
    }

    try {
      // CORREÇÃO: Buscar o endereço selecionado de forma segura
      let addressDetails = null;
      
      // Se for um pedido de delivery, buscar o endereço
      if (updatedOrderData.origin === 'delivery') {
        // Tentar encontrar o endereço de diferentes formas
        if (updatedOrderData.selectedAddressId && customerAddresses.length > 0) {
          // Buscar por ID selecionado
          addressDetails = customerAddresses.find(addr => addr.id === updatedOrderData.selectedAddressId);
        } else if (updatedOrderData.addressDetails) {
          // Usar addressDetails direto do orderData
          addressDetails = updatedOrderData.addressDetails;
        } else if (customerAddresses.length > 0) {
          // Usar o primeiro endereço disponível
          addressDetails = customerAddresses[0];
        }
        
        // Se ainda não encontrou endereço e é delivery, alertar
        if (!addressDetails) {
          showAlert("Endereço de entrega não encontrado para pedido delivery.", "warning");
          return;
        }
      }

      const preliminaryOrderData = {
        ...updatedOrderData,
        paymentDetails: paymentData,
        status: 'preparo', // Aqui é pra onde o pedido vai, onde ele aparecerá quando o usuario lança um pedido delivery manualmente
        businessId,
        customerId: customerData.uid || customerData.id || null,
        customerPhone: normalizePhoneNumber(customerData.phone || customerData.profile?.whatsapp),
        customerName: customerData.displayName, // Garante que o nome do cliente seja salvo
        addressDetails: addressDetails // CORREÇÃO: Usar a variável definida acima
      };

      const result = await createOrderWithSequentialId({ orderData: preliminaryOrderData });

      if (!result.data.success || !result.data.order) {
        throw new Error('A Cloud Function retornou uma falha ao criar o pedido.');
      }

      showAlert('Pedido criado com sucesso!', 'success');

      const newOrderFromServer = result.data.order;
      const createdAtDate = newOrderFromServer.createdAt && newOrderFromServer.createdAt._seconds
        ? new Date(newOrderFromServer.createdAt._seconds * 1000)
        : new Date();

      // Prepara dados completos para impressão
      const orderForPrint = {
        ...newOrderFromServer,
        tableName: 'DELIVERY',
        createdAt: createdAtDate,
        updatedAt: new Date(),
        customerName: customerData.displayName, // Garante nome na impressão
      };

      setTimeout(() => printKitchenOrder(orderForPrint), 500);

      setCurrentModal(null);
      setOrderData(null);
      setCustomerData(null);
      setCustomerAddresses([]);

    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', error);
      showAlert(`Erro ao finalizar pedido: ${error.message}`, "error");
    }
  };

  // --- COMPONENTE DE DETALHES DO PEDIDO ATUALIZADO ---
  const DetailPanelContent = ({ order }: { order: any }) => (
    <div className="p-6 h-full flex flex-col bg-white">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Pedido #{order.orderNumber}</h2>
          {/* CORREÇÃO: Sempre mostra o nome do cliente */}
          {/* <p className="text-gray-500 mb-2">{order.customerName}</p>*/}
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={order.status} />
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${order.origin === 'delivery'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
              }`}>
              {order.origin === 'delivery' ? 'Delivery' : 'Retirada Balcão'}
            </span>
          </div>

          {/* CORREÇÃO: Mostra telefone do cliente para delivery 
          {order.origin === 'delivery' && order.customerPhone && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mb-4">
              <Phone size={14} />
              {formatPhoneNumber(order.customerPhone)}
            </p>
          )} */}

        </div>
        {isMobile && (
          <button
            onClick={() => setSelectedOrder(null)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* NOVO: Informações de Pagamento no Painel de Detalhes 
      
      {order.paymentDetails && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Informações de Pagamentosss</h3>
          <PaymentInfo paymentDetails={order.paymentDetails} />
        </div>
      )}

      */}

      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {order.items.map((item: any, i: number) => (
          <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold bg-gray-200 text-gray-700 rounded w-6 h-6 flex items-center justify-center">
                {item.qty}x
              </span>
              <span className="font-semibold">{item.name}</span>
            </div>
            <span className="font-medium">{formatCurrency(item.salePrice * item.qty)}</span>
          </div>
        ))}
      </div>

      {/* PAINEL DE AÇÕES COM CORES HARMONIZADAS */}
      <div className="flex-shrink-0 pt-6 border-t border-gray-200 mt-4 space-y-3">
        {/* Ações primárias baseadas no status E tipo de pedido */}
        {order.status === 'analise' && (
          <button
            onClick={() => handleAction('aceitar', order)}
            className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
          >
            Aceitar Pedido
          </button>
        )}

        {/* CORREÇÃO: Botão dinâmico com cores harmonizadas */}
        {order.status === 'preparo' && (
          <button
            onClick={() => handleAction('enviar', order)}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${order.origin === 'delivery'
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
          >
            {order.origin === 'delivery' ? 'Enviar para Entrega' : 'Finalizar Pedido'}
          </button>
        )}

        {/* CORREÇÃO: Só mostra finalizar para delivery em trânsito */}
        {order.status === 'in_transit' && order.origin === 'delivery' && (
          <button
            onClick={() => handleAction('finalizar', order)}
            className="w-full py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
          >
            Finalizar Pedido
          </button>
        )}

        {/* Ações secundárias */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleAction('whatsapp', order)}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare size={16} />
            WhatsApp
          </button>

          <button
            onClick={() => handleAction('reprint', order)}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Printer size={16} />
            Reimprimir
          </button>

          <button
            onClick={() => handleAction('edit', order)}
            disabled={order.status !== 'analise' && order.status !== 'preparo'}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:bg-gray-50 disabled:text-gray-400 flex items-center justify-center gap-2"
          >
            <Edit size={16} />
            Editar
          </button>

          <button
            onClick={() => handleAction('delete', order)}
            disabled={order.status === 'finished' || order.status === 'canceled'}
            className="w-full py-3 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors disabled:bg-gray-50 disabled:text-gray-400 flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Excluir
          </button>
        </div>
      </div>
    </div>
  );

  // --- RENDERIZAÇÃO PRINCIPAL ---
  if (isMobile) {
    return (
      <div className="h-full w-full flex flex-col font-sans bg-gray-50">
        {/* Header Mobile */}
        <header className="bg-white flex-shrink-0 z-10 border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              to="/painel/dashboard"
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ChevronsLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Painel Delivery</h1>
              <p className="text-sm text-gray-500">Fluxo de pedidos em tempo real</p>
            </div>
          </div>
          <button
            onClick={handleStartNewOrder}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg shadow-sm font-semibold text-sm hover:bg-orange-600 transition-colors"
          >
            Novo Pedido
          </button>
        </header>

        {/* Abas Mobile */}
        <div className="px-4 pt-4 bg-white border-b border-gray-200">
          <nav className="flex space-x-4 overflow-x-auto">
            {Object.entries(workflowTabs).map(([key, tab]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`py-3 text-sm font-semibold whitespace-nowrap ${activeTab === key ? 'text-orange-600 border-b-2 border-orange-500' : 'text-gray-500'}`}
              >
                {tab.label} ({tab.orders.length})
              </button>
            ))}
          </nav>
        </div>

        {/* Lista de Pedidos Mobile com Duplo Clique - ATUALIZADO COM SISTEMA DE CORES */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {workflowTabs[activeTab].orders.map((order: any) => (
            <div
              key={order.id}
              onClick={(e) => handleOrderClick(order, e)}
              className={`p-4 bg-white rounded-lg border-white border-2 shadow-sm active:border-orange-500 transition-all duration-300 cursor-pointer relative overflow-hidden ${getOrderBorderColor(order)}`}
              title={getOrderTimeInfo(order)}
            >
              {/* Badge de tempo - Mobile 
              <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getMinutesElapsed(order) >= 15 ? 'bg-red-100 text-red-700' :
                  getMinutesElapsed(order) >= 10 ? 'bg-orange-100 text-orange-700' :
                    getMinutesElapsed(order) >= 5 ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                }`}>
                <Clock size={10} />
                <span>{getMinutesElapsed(order)}min</span>
              </div>
              */}

              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono px-3 py-1 bg-gray-100 text-gray-800 text-sm font-bold rounded-full">
                  Pedido #{order.orderNumber}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${order.origin === 'delivery'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                    }`}>
                    {order.origin === 'delivery' ? 'Delivery' : 'Balcão'}
                  </span>
                </div>
                {/* Timer com design melhorado */}
                <OrderTimer startTime={order.createdAt} />
              </div>

              {/* Sempre mostra o nome do cliente */}
              <h3 className="font-bold text-lg text-gray-800 mb-1">{order.customerName}</h3>

              <p className="text-sm text-gray-500">
                {order.origin === 'balcao' ? 'Retirada no Balcão' : order.deliveryAddress}
              </p>

              {/* Mostra telefone para pedidos delivery */}
              {order.origin === 'delivery' && order.customerPhone && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Phone size={12} />
                  {formatPhoneNumber(order.customerPhone)}
                </p>
              )}

              {/* Informações de Pagamento na lista */}
              {order.paymentDetails && (
                <div className="mt-2">
                  <PaymentInfo paymentDetails={order.paymentDetails} />
                </div>
              )}

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                <StatusBadge status={order.status} />
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(order.finalAmount)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de Detalhes Mobile */}
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title=""
          size="fullscreen"
        >
          {selectedOrder && <DetailPanelContent order={selectedOrder} />}
        </Modal>

        {/* Modais do Fluxo */}
        {currentModal && (
          <>
            {currentModal === 'search' && (
              <CustomerSearchModal
                isOpen={true}
                onClose={() => setCurrentModal(null)}
                onCustomerFound={handleCustomerFound}
              />
            )}

            {currentModal === 'register' && customerData && (
              <CustomerRegistrationModal
                isOpen={true}
                onClose={() => setCurrentModal(null)}
                customerData={customerData}
                onCustomerRegistered={handleCustomerRegistered}
              />
            )}

            {(currentModal === 'order' || currentModal === 'edit') && customerData && (
              <OrderCreationModal
                isOpen={true}
                onClose={() => setCurrentModal(null)}
                customerData={customerData}
                customerAddresses={customerAddresses}
                onOrderCreated={handleSaveOrder}
                deliveryFees={deliveryFees}
                initialOrderData={currentModal === 'edit' ? selectedOrder : null}
              />
            )}

            {currentModal === 'payment' && orderData && (
              <DeliveryPaymentModal
                isOpen={true}
                onClose={() => setCurrentModal(null)}
                orderData={orderData}
                onPaymentProcessed={handlePaymentProcessed}
              />
            )}
          </>
        )}
      </div>
    );
  }

  // Renderização Desktop - ATUALIZADA COM SISTEMA DE CORES
  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header Desktop */}
      <header className="bg-white flex-shrink-0 z-10 border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link
              to="/painel/dashboard"
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ChevronsLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Painel Delivery</h1>
              <p className="text-sm text-gray-500">Fluxo de pedidos em tempo real</p>
            </div>
          </div>
          <button
            onClick={handleStartNewOrder}
            className="px-5 py-2.5 bg-orange-500 text-white rounded-lg shadow-sm hover:bg-orange-600 transition-all font-semibold text-sm flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Novo Pedido
          </button>
        </div>
      </header>

      {/* Corpo Principal Desktop */}
      <div className="flex-1 flex overflow-hidden">
        {/* Coluna da Lista com Duplo Clique - ATUALIZADA COM SISTEMA DE CORES */}
        <div className="flex-[1.618] flex flex-col border-r border-gray-200">
          <div className="px-6 pt-4 bg-white">
            <nav className="flex border-b border-gray-200">
              {Object.entries(workflowTabs).map(([key, tab]) => (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); setSelectedOrder(null); }}
                  className={`px-4 py-3 text-sm font-semibold transition-colors ${activeTab === key ? 'text-orange-600 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  {tab.label} ({tab.orders.length})
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {workflowTabs[activeTab].orders.map((order: any) => (
              <div
                key={order.id}
                onClick={(e) => handleOrderClick(order, e)}
                className={`p-4 bg-white rounded-lg border-2 transition-all duration-300 cursor-pointer relative overflow-hidden ${getOrderBorderColor(order)} ${selectedOrder?.id === order.id
                    ? 'border-orange-500 shadow-lg'
                    : 'border-white hover:border-gray-300 shadow-sm'
                  }`}
                title={getOrderTimeInfo(order)}
              >
                {/* Badge de tempo - Desktop 

                <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getMinutesElapsed(order) >= 15 ? 'bg-red-100 text-red-700' :
                    getMinutesElapsed(order) >= 10 ? 'bg-orange-100 text-orange-700' :
                      getMinutesElapsed(order) >= 5 ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                  }`}>
                  <Clock size={10} />
                  <span>{getMinutesElapsed(order)}min</span>
                </div>

                */}

                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono px-3 py-1 bg-gray-100 text-gray-800 text-sm font-bold rounded-full">
                     Pedido #{order.orderNumber}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${order.origin === 'delivery'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                      }`}>
                      {order.origin === 'delivery' ? 'Delivery' : 'Balcão'}
                    </span>
                  </div>
                  {/* Timer com design melhorado */}
                  <OrderTimer startTime={order.createdAt} />
                </div>

                {/* Sempre mostra o nome do cliente */}
                <h3 className="font-bold text-lg text-gray-800 mb-1">{order.customerName}</h3>

                <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                  <MapPin size={14} />
                  {order.origin === 'balcao' ? 'Retirada no Balcão' : order.deliveryAddress}
                </p>

                {/* Mostra telefone para pedidos delivery */}
                {order.origin === 'delivery' && order.customerPhone && (
                  <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                    <Phone size={12} />
                    {formatPhoneNumber(order.customerPhone)}
                  </p>
                )}

                {/* Informações de Pagamento na lista */}
                {order.paymentDetails && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Informações de Pagamento</h3>
                    <PaymentInfo paymentDetails={order.paymentDetails} />
                  </div>
                )}

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                  <StatusBadge status={order.status} />
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(order.finalAmount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna de Detalhes Desktop */}
        <div className="flex-1 bg-white">
          <AnimatePresence>
            {selectedOrder ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <DetailPanelContent order={selectedOrder} />
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                <ShoppingCart size={32} />
                <h3 className="text-lg font-medium text-gray-600 mt-4">Painel de Controle</h3>
                <p>Selecione um pedido na lista para ver os detalhes.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Dica: Dê dois cliques rápidos em um pedido para editá-lo
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modais do Fluxo Desktop */}
      {currentModal && (
        <>
          {currentModal === 'search' && (
            <CustomerSearchModal
              isOpen={true}
              onClose={() => setCurrentModal(null)}
              onCustomerFound={handleCustomerFound}
            />
          )}

          {currentModal === 'register' && customerData && (
            <CustomerRegistrationModal
              isOpen={true}
              onClose={() => setCurrentModal(null)}
              customerData={customerData}
              onCustomerRegistered={handleCustomerRegistered}
            />
          )}

          {(currentModal === 'order' || currentModal === 'edit') && customerData && (
            <OrderCreationModal
              isOpen={true}
              onClose={() => setCurrentModal(null)}
              customerData={customerData}
              customerAddresses={customerAddresses}
              onOrderCreated={handleSaveOrder}
              deliveryFees={deliveryFees}
              initialOrderData={currentModal === 'edit' ? selectedOrder : null}
            />
          )}

          {currentModal === 'payment' && orderData && (
            <DeliveryPaymentModal
              isOpen={true}
              onClose={() => setCurrentModal(null)}
              orderData={orderData}
              onPaymentProcessed={handlePaymentProcessed}
            />
          )}
        </>
      )}
    </div>
  );
};