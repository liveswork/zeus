import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronsLeft, XCircle, ShoppingCart, Search } from 'lucide-react';
import { useBusiness } from '../../../contexts/BusinessContext';
import { useUI } from '../../../contexts/UIContext';
import { formatCurrency } from '../../../utils/formatters';
import { useTranslation } from 'react-i18next';
import { usePrintManager } from '../../../hooks/usePrintManager';

export const PDVManager: React.FC = () => {
  const { products, localCustomers, businessId } = useBusiness();
  const { showAlert } = useUI();
  const { t } = useTranslation();
  const { printKitchenOrder, printCustomerBill } = usePrintManager();
  
  const [isCaixaOpen, setIsCaixaOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [inputCode, setInputCode] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F12') {
        event.preventDefault();
        handleFinalizeSale();
      } else if (event.key === 'F2') {
        event.preventDefault();
        setCart([]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isCaixaOpen]);

  const handleProductLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    
    const searchTerm = inputCode.toLowerCase();
    const foundProduct = products.find(p =>
      (p.barcode && p.barcode.toLowerCase() === searchTerm) ||
      (p.sku && p.sku.toLowerCase() === searchTerm) ||
      p.name.toLowerCase().includes(searchTerm)
    );

    if (foundProduct) {
      const existingItem = cart.find((item: any) => item.id === foundProduct.id);
      if (existingItem) {
        setCart(cart.map((item: any) => 
          item.id === foundProduct.id ? { ...item, qty: item.qty + 1 } : item
        ));
      } else {
        setCart([...cart, { ...foundProduct, qty: 1 }]);
      }
    } else {
      showAlert(`Produto com código "${inputCode}" não encontrado.`);
    }
    setInputCode('');
  };

  const totalAmount = useMemo(() => 
    cart.reduce((total: number, item: any) => total + (item.salePrice * item.qty), 0), 
    [cart]
  );

  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      showAlert("Adicione produtos ao carrinho para finalizar a venda.");
      return;
    }
    
    // Criar objeto de pedido para impressão
    const orderForPrint = {
      id: 'PDV-' + Date.now(),
      tableName: 'PDV - Caixa 001',
      businessId: businessId || 'current-business',
      status: 'completed' as const,
      items: cart.map((item: any) => ({
        productId: item.id,
        name: item.name,
        qty: item.qty,
        salePrice: item.salePrice,
        observation: ''
      })),
      totalAmount,
      customerId: selectedCustomerId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Imprimir automaticamente
    console.log('Iniciando impressão PDV...');
    setTimeout(() => {
      printKitchenOrder(orderForPrint);
    }, 500);

    setTimeout(() => {
      printCustomerBill(orderForPrint);
    }, 1500);
    
    // Clear cart after sale
    setCart([]);
    setSelectedCustomerId('');
    showAlert('Venda finalizada com sucesso!');
  };

  const handleOpenCaixa = () => setIsCaixaOpen(true);

  if (!isCaixaOpen) {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center bg-gray-700 text-white">
        <h1 className="text-5xl font-bold">Caixa Fechado</h1>
        <p className="text-xl mt-2">Clique abaixo para iniciar as operações do dia.</p>
        <button
          onClick={handleOpenCaixa}
          className="mt-8 bg-green-600 text-white font-bold py-4 px-10 rounded-lg text-2xl hover:bg-green-700 transition"
        >
          Abrir Caixa
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-gray-200 font-sans overflow-hidden">
      {/* Banner Lateral */}
      <div className="w-96 bg-gray-800 flex-shrink-0 flex items-center justify-center">
        <div className="text-white text-center">
          <ShoppingCart size={64} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold">FoodPDV</h2>
          <p className="text-gray-300">Sistema de Vendas</p>
        </div>
      </div>
      
      <div className="flex-grow flex flex-col p-4">
        <header className="flex-shrink-0 flex justify-between items-center mb-4 text-gray-700">
          <Link 
            to="/painel/dashboard" 
            className="bg-gray-300 py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-gray-400 transition"
          >
            <ChevronsLeft size={20} /> Voltar ao Painel
          </Link>
          
          <div className="text-right">
            <h2 className="text-2xl font-bold">CAIXA 001</h2>
            <p className="text-sm">Sistema PDV</p>
          </div>
          
          <button 
            onClick={() => setIsCaixaOpen(false)} 
            className="bg-red-500 text-white py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-red-600 transition"
          >
            <XCircle size={20} /> Fechar Caixa
          </button>
        </header>

        <form onSubmit={handleProductLookup} className="flex-shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Ler Cód. de Barras ou Digitar Nome/SKU e pressionar Enter"
            className="w-full p-4 text-xl border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </form>

        <select
          value={selectedCustomerId}
          onChange={e => setSelectedCustomerId(e.target.value)}
          className="w-full p-2 border rounded mt-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Cliente Padrão (Não Identificado)</option>
          {localCustomers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div className="flex-grow my-4 bg-white rounded-lg shadow-inner overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr className="text-left text-gray-600">
                <th className="p-3 w-1/2">Item</th>
                <th className="p-3">Qtd.</th>
                <th className="p-3">Vl. Unit.</th>
                <th className="p-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item: any) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="p-3 font-semibold">{item.name}</td>
                  <td className="p-3">{item.qty}</td>
                  <td className="p-3">{formatCurrency(item.salePrice)}</td>
                  <td className="p-3 text-right font-bold">
                    {formatCurrency(item.salePrice * item.qty)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cart.length === 0 && (
            <p className="text-center text-gray-400 p-10">Aguardando itens...</p>
          )}
        </div>

        <footer className="flex-shrink-0 flex justify-between items-end">
          <div className="space-x-2">
            <button 
              onClick={() => setCart([])} 
              className="bg-gray-500 text-white font-semibold py-3 px-5 rounded-lg hover:bg-gray-600 transition"
            >
              Cancelar (F2)
            </button>
            <button className="bg-yellow-500 text-white font-semibold py-3 px-5 rounded-lg hover:bg-yellow-600 transition">
              Pesquisar (F3)
            </button>
          </div>
          
          <div className="text-right">
            <p className="text-2xl font-semibold text-gray-600">Total da Venda</p>
            <p className="text-6xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
          </div>
          
          <button 
            onClick={handleFinalizeSale} 
            className="bg-green-600 text-white font-bold py-6 px-10 rounded-lg text-2xl hover:bg-green-700 transition"
          >
            {t('pdv.finalizeSale')}
          </button>
        </footer>
      </div>
    </div>
  );
};