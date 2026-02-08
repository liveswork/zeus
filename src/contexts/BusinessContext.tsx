import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit, updateDoc, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Product, Supply, Sale, Supplier, Table, Order, DeliveryFee, Customer, Category, Subcategory, LoyaltyTransaction, LoyaltyReward, LoyaltySettings, AddonGroup } from '../types';
import { getStorage, ref, deleteObject } from 'firebase/storage';

interface BusinessContextType {
  products: Product[];
  supplies: Supply[];
  categories: Category[];
  subcategories: Subcategory[];
  sales: Sale[];
  suppliers: Supplier[];
  tables: Table[];
  addonGroups: AddonGroup[];
  orders: Order[];
  deliveryFees: DeliveryFee[];
  localCustomers: Customer[];
  loyaltyTransactions: LoyaltyTransaction[];
  loyaltyRewards: LoyaltyReward[];
  loyaltySettings: LoyaltySettings | null;
  businessId: string | null;
  loading: boolean;
  refreshData: () => void;
  onSaveProduct: (productData: Product, isEditing: boolean) => Promise<Product>;
  onDeleteProductImage: (imagePath: string) => Promise<void>;
  onSaveSupply: (supplyData: Partial<Supply>, isEditing: boolean) => Promise<void>; // <-- ADICIONE ESTA LINHA
  onDeleteSupply: (supplyId: string) => Promise<void>; // <-- ADICIONE ESTA LINHA
  onDeleteSupplyImage: (imagePath: string) => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | null>(null);

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};

interface BusinessProviderProps {
  children: ReactNode;
}

export const BusinessProvider: React.FC<BusinessProviderProps> = ({ children }) => {
  const { userProfile } = useAuth();

  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryFees, setDeliveryFees] = useState<DeliveryFee[]>([]);
  const [localCustomers, setLocalCustomers] = useState<Customer[]>([]);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoyaltyReward[]>([]);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
  const [globalCustomers, setGlobalCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const businessId = userProfile?.businessId || userProfile?.restaurantId || null;

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    const unsubscribes: Array<() => void> = [];

    const productsQuery = query(
      collection(db, 'products'),
      where("businessId", "==", businessId),
      orderBy('name')
    );
    unsubscribes.push(
      onSnapshot(productsQuery, (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      })
    );

    // Listener para AddonGroups
    const addonsQuery = query(
      collection(db, 'addonGroups'),
      where("businessId", "==", businessId),
      orderBy('name')
    );
    unsubscribes.push(
      onSnapshot(addonsQuery, (snapshot) => {
        setAddonGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AddonGroup)));
      })
    );

    const categoriesQuery = query(
      collection(db, 'categories'),
      where("businessId", "==", businessId),
      orderBy('sortOrder')
    );
    unsubscribes.push(
      onSnapshot(categoriesQuery, (snapshot) => {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      })
    );

    const subcategoriesQuery = query(
      collection(db, 'subcategories'),
      where("businessId", "==", businessId),
      orderBy('sortOrder')
    );
    unsubscribes.push(
      onSnapshot(subcategoriesQuery, (snapshot) => {
        setSubcategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subcategory)));
      })
    );

    const suppliesQuery = query(
      collection(db, 'supplies'),
      where("businessId", "==", businessId),
      orderBy('name')
    );
    unsubscribes.push(
      onSnapshot(suppliesQuery, (snapshot) => {
        setSupplies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supply)));
      })
    );

    const salesQuery = query(
      collection(db, 'sales'),
      where("businessId", "==", businessId),
      orderBy('finishedAt', 'desc'),
      limit(50)
    );
    const salesUnsub = onSnapshot(salesQuery, snapshot => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    });

    const tablesQuery = query(
      collection(db, 'tables'),
      where("businessId", "==", businessId),
      orderBy('number')
    );
    unsubscribes.push(
      onSnapshot(tablesQuery, (snapshot) => {
        setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table)));
      })
    );

    const ordersQuery = query(
      collection(db, 'orders'),
      where("businessId", "==", businessId),
      orderBy('createdAt', 'desc')
    );
    unsubscribes.push(
      onSnapshot(ordersQuery, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      })
    );

    const feesQuery = query(
      collection(db, 'users', businessId, 'deliveryFees'),
      orderBy("neighborhood")
    );
    unsubscribes.push(
      onSnapshot(feesQuery, (snapshot) => {
        setDeliveryFees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeliveryFee)));
      })
    );

    const customersQuery = query(
      collection(db, 'users', businessId, 'localCustomers'),
      orderBy('name')
    );
    unsubscribes.push(
      onSnapshot(customersQuery, (snapshot) => {
        const localCustomersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            orderCount: data.orderCount || 0,
            totalSpent: data.totalSpent || 0,
            loyaltyPoints: data.loyaltyPoints || 0,
            loyaltyLevel: data.loyaltyLevel || 'Bronze'
          } as Customer;
        });

        setLocalCustomers(localCustomersData);
      })
    );

    const globalCustomersQuery = query(
      collection(db, 'globalCustomers'),
      orderBy('name')
    );
    unsubscribes.push(
      onSnapshot(globalCustomersQuery, (snapshot) => {
        setGlobalCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      })
    );

    const loyaltyTransactionsQuery = query(
      collection(db, 'loyaltyTransactions'),
      where("businessId", "==", businessId),
      orderBy('createdAt', 'desc')
    );
    unsubscribes.push(
      onSnapshot(loyaltyTransactionsQuery, (snapshot) => {
        setLoyaltyTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoyaltyTransaction)));
      })
    );

    const loyaltyRewardsQuery = query(
      collection(db, 'loyaltyRewards'),
      where("businessId", "==", businessId),
      where("isActive", "==", true)
    );
    unsubscribes.push(
      onSnapshot(loyaltyRewardsQuery, (snapshot) => {
        setLoyaltyRewards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoyaltyReward)));
      })
    );

    const loyaltySettingsQuery = query(
      collection(db, 'loyaltySettings'),
      where("businessId", "==", businessId)
    );
    unsubscribes.push(
      onSnapshot(loyaltySettingsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const settingsDoc = snapshot.docs[0];
          setLoyaltySettings({ id: settingsDoc.id, ...settingsDoc.data() } as LoyaltySettings);
        } else {
          setLoyaltySettings(null);
        }
      })
    );

    const manualSuppliersQuery = query(
      collection(db, 'suppliers'),
      where("businessId", "==", businessId)
    );
    const partnerSuppliersQuery = query(
      collection(db, 'suppliers'),
      where("associatedBusinesses", "array-contains", businessId)
    );

    const unsubManual = onSnapshot(manualSuppliersQuery, (manualSnapshot) => {
      const manualSupps = manualSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Supplier));

      const unsubPartner = onSnapshot(partnerSuppliersQuery, (partnerSnapshot) => {
        const partnerSupps = partnerSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Supplier));
        const allSuppliers = [...manualSupps];

        partnerSupps.forEach(ps => {
          if (!allSuppliers.find(ms => ms.id === ps.id)) {
            allSuppliers.push(ps);
          }
        });

        setSuppliers(allSuppliers.sort((a, b) => a.name.localeCompare(b.name)));
        setLoading(false);
      });

      unsubscribes.push(unsubPartner);
    });

    unsubscribes.push(unsubManual);

    return () => {
      salesUnsub();

      unsubscribes.forEach(unsub => unsub());
    };
  }, [businessId]);

  const onSaveSupply = async (supplyData: Partial<Supply>, isEditing: boolean) => {
    if (!businessId) throw new Error("ID do negócio não encontrado.");

    try {
      if (isEditing && supplyData.id) {
        const supplyRef = doc(db, 'supplies', supplyData.id);
        await updateDoc(supplyRef, { ...supplyData, businessId });
      } else {
        const { id, ...dataWithoutId } = supplyData;
        await addDoc(collection(db, 'supplies'), { ...dataWithoutId, businessId });
      }
    } catch (error) {
      console.error("Erro ao salvar insumo:", error);
      throw error; // Lança o erro para o componente que chamou poder tratar
    }
  };

  const onDeleteSupply = async (supplyId: string) => {
    try {
      await deleteDoc(doc(db, 'supplies', supplyId));
    } catch (error) {
      console.error("Erro ao deletar insumo:", error);
      throw error;
    }
  };

  const onDeleteSupplyImage = async (imagePath: string) => {
    if (!imagePath) return;
    const storage = getStorage();
    const imageRef = ref(storage, imagePath);
    try {
      await deleteObject(imageRef);
    } catch (error: any) {
      // Ignora o erro se o objeto não for encontrado (já pode ter sido deletado)
      if (error.code !== 'storage/object-not-found') {
        console.error("Erro ao deletar imagem antiga do Storage:", error);
        throw error;
      }
    }
  };

  const onSaveProduct = async (productData: Product, isEditing: boolean): Promise<Product> => { // Adicione o tipo de retorno aqui também
    const businessId = userProfile?.businessId;
    if (!businessId) throw new Error("ID do negócio não encontrado.");

    try {
      if (isEditing && productData.id) {
        const productRef = doc(db, 'products', productData.id);
        // Remove o campo 'id' do objeto a ser atualizado para evitar erros do Firestore
        const { id, ...dataToUpdate } = productData;
        await updateDoc(productRef, { ...dataToUpdate, businessId });
        return productData; // Retorna o produto completo
      } else {
        const { id, ...dataWithoutId } = productData;
        const newDocRef = await addDoc(collection(db, 'products'), { ...dataWithoutId, businessId });
        return { ...dataWithoutId, id: newDocRef.id } as Product; // Retorna o novo produto com seu ID
      }
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      throw error;
    }
  };


  const onDeleteProductImage = async (imagePath: string) => {
    if (!imagePath) return;

    // Verifica se o caminho é válido e começa com 'uploads/'
    if (!imagePath.startsWith('uploads/')) {
      console.warn("Caminho de imagem inválido:", imagePath);
      return;
    }

    const storage = getStorage();
    const imageRef = ref(storage, imagePath);

    try {
      await deleteObject(imageRef);
      console.log("Imagem deletada com sucesso:", imagePath);
    } catch (error: any) {
      // Ignora o erro se o objeto não for encontrado
      if (error.code === 'storage/object-not-found') {
        console.log("Imagem já não existe no Storage:", imagePath);
        return;
      }

      // Log mais detalhado para outros erros
      console.error("Erro ao deletar imagem do Storage:", {
        code: error.code,
        message: error.message,
        path: imagePath
      });

      // Não lança o erro para não quebrar o fluxo da aplicação
      // pois a imagem pode já ter sido deletada ou o usuário não ter permissão
    }
  };

  const refreshData = () => {
    setLoading(true);
  };

  const value = {
    userProfile,
    products,
    supplies,
    categories,
    subcategories,
    sales,
    suppliers,
    tables,
    addonGroups,
    orders,
    deliveryFees,
    localCustomers,
    loyaltyTransactions,
    loyaltyRewards,
    loyaltySettings,
    businessId,
    loading,
    refreshData,
    onSaveProduct,
    onDeleteProductImage,
    onSaveSupply,
    onDeleteSupply,
    onDeleteSupplyImage,
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};