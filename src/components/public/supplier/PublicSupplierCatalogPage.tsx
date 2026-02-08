import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Truck, Phone, Instagram, MapPin, Package, Building } from 'lucide-react';
import { db } from '../../../config/firebase';
import { formatCurrency } from '../../../utils/formatters';

export const PublicSupplierCatalogPage: React.FC = () => {
  const { supplierId } = useParams();
  const [supplierProfile, setSupplierProfile] = useState<any>(null);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supplierId) {
      setError("ID do fornecedor não fornecido.");
      setLoading(false);
      return;
    }

    const fetchSupplierData = async () => {
      try {
        // Buscar perfil do fornecedor na coleção suppliers
        const supplierRef = doc(db, 'suppliers', supplierId);
        const supplierSnap = await getDoc(supplierRef);

        if (supplierSnap.exists()) {
          setSupplierProfile(supplierSnap.data());
        } else {
          throw new Error("Fornecedor não encontrado.");
        }

        // Buscar produtos do fornecedor
        const productsQuery = query(
          collection(db, 'supplierProducts'),
          where("supplierId", "==", supplierId)
        );

        const productsSnapshot = await getDocs(productsQuery);
        setCatalogProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (err: any) {
        console.error("Erro ao buscar dados do fornecedor:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierData();
  }, [supplierId]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-xl">Carregando catálogo do fornecedor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-xl text-red-500">Erro: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="mb-10 bg-white p-8 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
              {supplierProfile?.logoUrl ? (
                <img 
                  src={supplierProfile.logoUrl} 
                  alt={`Logo de ${supplierProfile.name}`} 
                  className="w-full h-full object-contain rounded-full"
                />
              ) : (
                <Truck size={64} className="text-gray-400" />
              )}
            </div>
            
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                {supplierProfile?.name}
              </h1>
              
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-2 mt-4 text-gray-600">
                {supplierProfile?.phone && (
                  <span className="flex items-center gap-2">
                    <Phone size={16} /> {supplierProfile.phone}
                  </span>
                )}
                {supplierProfile?.instagram && (
                  <span className="flex items-center gap-2">
                    <Instagram size={16} /> {supplierProfile.instagram}
                  </span>
                )}
                {supplierProfile?.address?.city && (
                  <span className="flex items-center gap-2">
                    <MapPin size={16} /> {supplierProfile.address.city}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* CTA Section */}
        <div className="bg-blue-600 text-white p-6 rounded-lg shadow-lg text-center mb-10">
          <h2 className="text-2xl font-bold">É um restaurante ou negócio?</h2>
          <p className="mt-2">
            Cadastre-se em nossa plataforma para enviar orçamentos diretamente!
          </p>
          <Link 
            to="/login" 
            className="mt-4 inline-block bg-white text-blue-600 font-bold py-2 px-6 rounded-full hover:bg-gray-100 transition"
          >
            Acessar Plataforma
          </Link>
        </div>

        {/* Products Grid */}
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Nossos Produtos</h2>
        
        {catalogProducts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.productName} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Package size={48} className="text-gray-400" />
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{product.productName}</h3>
                  {product.description && (
                    <p className="text-sm text-gray-600 mt-2">{product.description}</p>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(product.price)}
                    </p>
                    <span className="text-sm font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                      {product.unitOfSale}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8 bg-white rounded-lg shadow-md">
            Este fornecedor ainda não publicou produtos em seu catálogo.
          </p>
        )}
      </div>
    </div>
  );
};