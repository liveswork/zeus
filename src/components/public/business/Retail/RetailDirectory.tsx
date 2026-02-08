import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Store, Search, Star } from 'lucide-react';
import { db } from '../../../../config/firebase';
import { UserProfile } from '../../../../types';

// Tipo para os dados do Firestore (mais flexível)
type FirestoreUser = Omit<UserProfile, 'uid'> & {
  id: string;
  uid?: string;
};

export const RetailDirectory: React.FC = () => {
  const [stores, setStores] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where("role", "==", "business"),
          where("status", "==", "active")
        );
        const querySnapshot = await getDocs(q);
        const storeData = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              uid: data.uid || doc.id, // Fallback para doc.id se uid não existir
              email: data.email || '',
              displayName: data.displayName || '',
              role: data.role || 'business',
              companyName: data.companyName || '',
              businessProfile: data.businessProfile,
              logoUrl: data.logoUrl,
              status: data.status || 'active',
              // Adicione outras propriedades necessárias aqui
            } as UserProfile;
          })
          .filter(store => 
            store.businessProfile?.type === 'retail'
          );
        
        setStores(storeData);
      } catch (error) {
        console.error("Erro ao buscar lojas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  const filteredStores = stores.filter(store =>
    (store.companyName || store.displayName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <p className="text-xl">Carregando lojas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">
          Encontre as Melhores Lojas
        </h1>
        
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar lojas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStores.map(store => (
          <Link
            key={store.uid}
            to={`/loja/${store.uid}`}
            className="group bg-white border rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
          >
            <div className="aspect-video bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center relative overflow-hidden">
              {store.logoUrl ? (
                <img
                  src={store.logoUrl}
                  alt={store.companyName || store.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store size={48} className="text-white" />
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {store.companyName || store.displayName}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {store.businessProfile?.subCategory || 'Loja'}
                </span>
                <span className="bg-green-500 text-white text-sm font-bold py-1 px-3 rounded-full group-hover:bg-green-600 transition-colors">
                  Ver Produtos →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredStores.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhuma loja encontrada.</p>
        </div>
      )}
    </div>
  );
};