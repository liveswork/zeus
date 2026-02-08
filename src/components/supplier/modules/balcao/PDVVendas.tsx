import React, { useState, useEffect } from 'react';
import { Building, ShoppingCart, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db as firestore } from '../../../../config/firebase'; 
import { collection, getDocs } from 'firebase/firestore';

// Supondo a existência desses tipos
import { BusinessProfile, SupplierProduct } from '../../../../types';

// Componente simples de modal para busca de Business
const BusinessSearchModal = ({ isOpen, onClose, onBusinessSelect }) => {
    const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            const fetchBusinesses = async () => {
                try {
                    const querySnapshot = await getDocs(collection(firestore, 'businessProfiles'));
                    const businessesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BusinessProfile[];
                    setBusinesses(businessesData);
                } catch (error) {
                    console.error("Erro ao buscar estabelecimentos:", error);
                }
            };
            fetchBusinesses();
        }
    }, [isOpen]);

    // LINHA CORRIGIDA AQUI
    const filteredBusinesses = businesses.filter(b => 
        b.name && typeof b.name === 'string' && b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-1/3">
                <h2 className="text-xl font-bold mb-4">Selecionar Cliente (Estabelecimento)</h2>
                <input
                    type="text"
                    placeholder="Buscar por nome..."
                    className="w-full p-2 border rounded mb-4"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <ul className="max-h-80 overflow-y-auto">
                    {filteredBusinesses.map(business => (
                        <li key={business.id} onClick={() => onBusinessSelect(business)} className="p-2 hover:bg-gray-200 cursor-pointer rounded">
                            {business.name || 'Nome não definido'}
                        </li>
                    ))}
                </ul>
                <button onClick={onClose} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">Fechar</button>
            </div>
        </div>
    );
};


const SupplierPDV: React.FC = () => {
  const { t } = useTranslation();
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessProfile | null>(null);
  const [isBusinessModalOpen, setBusinessModalOpen] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  // Produtos do catálogo do fornecedor
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]); 

  useEffect(() => {
    // Lógica para carregar os produtos do catálogo do fornecedor logado
    // const fetchProducts = async () => { ... };
    // fetchProducts();
  }, []);

  const handleBusinessSelect = (business: BusinessProfile) => {
    setSelectedBusiness(business);
    setBusinessModalOpen(false);
  };
  
  const handleAddToCart = (product: SupplierProduct) => {
      // Lógica para adicionar ao carrinho, talvez com um modal de quantidade
      setCart(prevCart => [...prevCart, { ...product, quantity: 1 }]);
  }
  
  const handleFinalizeSale = () => {
      // Lógica para criar uma Ordem de Compra (PurchaseOrder)
      // Poderia integrar com o módulo de "fiado" (DebtsManager)
      console.log("Venda finalizada para:", selectedBusiness, "Itens:", cart);
      // Limpar estado e reiniciar
      setSelectedBusiness(null);
      setCart([]);
      setBusinessModalOpen(true);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t('PDV do Fornecedor')}</h1>

      {!selectedBusiness ? (
        <button
          onClick={() => setBusinessModalOpen(true)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2"
        >
          <Building /> {t('Selecionar Estabelecimento')}
        </button>
      ) : (
        <div>
            <div className="flex justify-between items-center mb-4 bg-gray-100 p-4 rounded-lg">
                <h2 className="text-xl">Cliente: <span className="font-bold">{selectedBusiness.name}</span></h2>
                <button onClick={() => { setSelectedBusiness(null); setBusinessModalOpen(true); }} className="text-sm text-red-500 hover:underline">
                    {t('Trocar Cliente')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Coluna de Produtos */}
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-2">Catálogo de Produtos</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Exemplo de produto - você vai carregar dinamicamente */}
                        <div onClick={() => handleAddToCart({id: 'prod1', name: 'Caixa de Refri', price: 50})} className="border p-4 rounded-lg text-center cursor-pointer hover:shadow-md">
                            <p className="font-bold">Caixa de Refri</p>
                            <p>R$ 50,00</p>
                        </div>
                    </div>
                </div>

                {/* Coluna do Carrinho */}
                <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><ShoppingCart /> {t('Pedido')}</h3>
                    <div className="bg-white p-4 rounded-lg shadow">
                       {cart.length === 0 ? (
                           <p className="text-gray-500">O carrinho está vazio.</p>
                       ) : (
                           cart.map((item, index) => (
                               <div key={index} className="flex justify-between items-center mb-2">
                                   <span>{item.name} x{item.quantity}</span>
                                   <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                               </div>
                           ))
                       )}
                       <hr className="my-2"/>
                       <div className="flex justify-between font-bold text-lg">
                           <span>Total</span>
                           <span>R$ {cart.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}</span>
                       </div>
                       <button 
                         onClick={handleFinalizeSale}
                         disabled={cart.length === 0}
                         className="w-full mt-4 bg-green-500 text-white py-2 rounded-lg disabled:bg-gray-400 flex items-center justify-center gap-2"
                        >
                           <DollarSign size={18} /> {t('Finalizar Venda')}
                       </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {isBusinessModalOpen && (
        <BusinessSearchModal
          isOpen={isBusinessModalOpen}
          onClose={() => {
            if (!selectedBusiness) setBusinessModalOpen(false);
          }}
          onBusinessSelect={handleBusinessSelect}
        />
      )}
    </div>
  );
};

export default SupplierPDV;