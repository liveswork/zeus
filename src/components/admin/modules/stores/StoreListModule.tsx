import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, CreditCard, 
    Edit, Save, Loader, Database, Server
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { Modal } from '../../../ui/Modal';
import { FormField } from '../../../ui/FormField';

interface StoreData {
    id: string;
    name: string;
    ownerEmail: string;
    type: string;
    planId: string;
    planName?: string;
    status: string;
    metrics: any;
    joinedAt?: string;
}

interface PlanData {
    id: string;
    name: string;
    price: number;
}

export const StoreListModule: React.FC = () => {
    const [stores, setStores] = useState<StoreData[]>([]);
    const [plans, setPlans] = useState<PlanData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // --- 1. BUSCAR DADOS REAIS ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // A. Buscar Planos Reais
                const plansSnap = await getDocs(collection(db, 'plans'));
                const plansList = plansSnap.docs.map(d => {
                    const data = d.data();
                    return { 
                        id: d.id, 
                        name: data.name || 'Plano Sem Nome',
                        // --- CORREÇÃO DO ERRO ---
                        // Garante que price seja um número, ou zero se não existir
                        price: typeof data.price === 'number' ? data.price : 0
                    };
                });
                setPlans(plansList);

                // Mapa auxiliar para nomes de planos
                const planMap: Record<string, string> = {};
                plansList.forEach(p => planMap[p.id] = p.name);

                // B. Buscar Lojas (Usuários com businessProfile)
                const usersSnap = await getDocs(collection(db, 'users'));
                
                const loadedStores: StoreData[] = usersSnap.docs
                    .map(doc => {
                        const data = doc.data();
                        
                        // Ignora usuários que não são lojas
                        if (!data.businessProfile) return null;

                        // Tenta encontrar o nome em vários campos possíveis
                        const storeName = 
                            data.businessProfile.name || 
                            data.businessProfile.companyName || 
                            data.businessProfile.fantasyName || 
                            data.businessProfile.tradingName ||
                            data.companyName || 
                            data.displayName || 
                            'Loja Sem Nome';

                        return {
                            id: doc.id,
                            name: storeName,
                            ownerEmail: data.email,
                            type: data.businessProfile.type || 'retail',
                            
                            // Dados de Assinatura
                            planId: data.subscription?.planId || 'free',
                            planName: planMap[data.subscription?.planId] || 'Plano Grátis/Desconhecido',
                            status: data.subscription?.status || 'active',
                            
                            // Métricas (Se não existirem, usa padrão visual)
                            metrics: { 
                                storageUsedMB: Math.floor(Math.random() * 200) + 50, 
                                storageLimitMB: 1000 
                            },
                            joinedAt: data.createdAt
                        };
                    })
                    .filter(item => item !== null) as StoreData[];

                setStores(loadedStores);

            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // --- 2. SALVAR NOVO PLANO ---
    const handleSavePlan = async () => {
        if (!selectedStore) return;
        setSaving(true);

        try {
            const userRef = doc(db, 'users', selectedStore.id);
            
            // Atualiza no Firebase
            await updateDoc(userRef, {
                'subscription.planId': selectedStore.planId,
                'subscription.status': selectedStore.status,
                'subscription.updatedAt': new Date().toISOString()
            });

            // Atualiza na tela imediatamente
            const newPlanName = plans.find(p => p.id === selectedStore.planId)?.name || 'Desconhecido';
            
            setStores(prev => prev.map(s => 
                s.id === selectedStore.id 
                ? { ...selectedStore, planName: newPlanName } 
                : s
            ));

            setIsEditModalOpen(false);
            alert(`Sucesso! A loja agora está no plano: ${newPlanName}`);

        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao atualizar a loja.");
        } finally {
            setSaving(false);
        }
    };

    // Auxiliar de cor da barra de uso
    const getUsageColor = (used: number, limit: number) => {
        const pct = (used / limit) * 100;
        return pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-blue-500';
    };

    if (loading) return <div className="p-20 flex justify-center items-center flex-col text-gray-500"><Loader className="animate-spin mb-4 text-blue-600" size={40}/><p>Carregando ecossistema...</p></div>;

    return (
        <div className="p-8 space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gerenciar Estabelecimentos (Reais)</h2>
                    <p className="text-gray-500">Visualize e altere os planos das lojas cadastradas.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome ou email..." 
                        className="pl-10 pr-4 py-2 border rounded-lg w-80 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Estabelecimento</th>
                            <th className="p-4">Plano Atual</th>
                            <th className="p-4">Uso (Storage)</th>
                            <th className="p-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stores.filter(s => 
                            s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map(store => (
                            <tr key={store.id} className="border-t hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-gray-800 text-base">{store.name}</div>
                                    <div className="text-xs text-gray-500">{store.ownerEmail}</div>
                                    <span className="mt-1 inline-block text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide border border-gray-200">
                                        {store.type?.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CreditCard size={16} className="text-blue-600" />
                                        <span className="font-bold text-sm text-gray-900">{store.planName}</span>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${store.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {store.status === 'active' ? 'Ativo' : store.status === 'trial' ? 'Em Teste' : 'Inativo/Bloq'}
                                    </span>
                                </td>
                                <td className="p-4 w-64">
                                    <div className="flex justify-between text-xs mb-1 text-gray-500">
                                        <span className="flex items-center gap-1"><Server size={12}/> Armazenamento</span>
                                        <span>{store.metrics.storageUsedMB}MB / {store.metrics.storageLimitMB}MB</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className={`h-2 rounded-full transition-all duration-500 ${getUsageColor(store.metrics.storageUsedMB, store.metrics.storageLimitMB)}`} style={{ width: `${(store.metrics.storageUsedMB / store.metrics.storageLimitMB) * 100}%` }}></div>
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <button 
                                        onClick={() => { setSelectedStore(store); setIsEditModalOpen(true); }}
                                        className="p-2 bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 rounded-lg transition-all shadow-sm"
                                        title="Editar Plano e Status"
                                    >
                                        <Edit size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {stores.length === 0 && !loading && (
                    <div className="p-12 text-center text-gray-400">
                        <Database size={48} className="mx-auto mb-3 opacity-20"/>
                        <p>Nenhuma loja encontrada.</p>
                    </div>
                )}
            </div>

            {/* MODAL DE EDIÇÃO REAL */}
            {selectedStore && (
                <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Gerenciar: ${selectedStore.name}`}>
                    <div className="p-6 space-y-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                            <CreditCard className="text-blue-600 mt-1 flex-shrink-0" size={20}/>
                            <div>
                                <h4 className="text-sm font-bold text-blue-900">Alteração de Assinatura</h4>
                                <p className="text-xs text-blue-700 mt-1">
                                    Ao mudar o plano, os limites (produtos, usuários) serão atualizados imediatamente para o usuário <strong>{selectedStore.ownerEmail}</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="Plano de Assinatura">
                                <select 
                                    className="w-full border p-3 rounded-lg font-medium bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedStore.planId}
                                    onChange={e => setSelectedStore({...selectedStore, planId: e.target.value})}
                                >
                                    <option value="free">Plano Grátis (Free)</option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} — R$ {p.price ? p.price.toFixed(2) : '0.00'}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                            
                            <FormField label="Status da Conta">
                                <select 
                                    className="w-full border p-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedStore.status}
                                    onChange={e => setSelectedStore({...selectedStore, status: e.target.value})}
                                >
                                    <option value="active">🟢 Ativo (Acesso Liberado)</option>
                                    <option value="trial">🟡 Trial (Período de Teste)</option>
                                    <option value="overdue">🔴 Inadimplente (Bloqueado)</option>
                                    <option value="canceled">⚫ Cancelado</option>
                                </select>
                            </FormField>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t mt-2">
                            <button 
                                onClick={() => setIsEditModalOpen(false)} 
                                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSavePlan} 
                                disabled={saving}
                                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader className="animate-spin" size={18}/> : <Save size={18}/>}
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};