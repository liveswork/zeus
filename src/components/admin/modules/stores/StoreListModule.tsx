import React, { useState } from 'react';
import { 
    Search, Filter, MoreVertical, Database, 
    Box, CreditCard, Edit, Trash2, Server 
} from 'lucide-react';
import { Modal } from '../../../ui/Modal';
import { FormField } from '../../../ui/FormField';

// Tipagem Avançada
interface StoreData {
    id: string;
    name: string;
    ownerEmail: string;
    type: 'retail' | 'food';
    plan: 'free' | 'pro' | 'ultra' | 'enterprise';
    status: 'active' | 'blocked' | 'trial';
    metrics: {
        products: number;
        orders: number;
        storageUsedMB: number;
        storageLimitMB: number;
    };
    joinedAt: string;
}

export const StoreListModule: React.FC = () => {
    // MOCK DATA (Simulando o Banco de Dados)
    const [stores, setStores] = useState<StoreData[]>([
        { 
            id: '1', name: 'Mega Loja Roupas', ownerEmail: 'contato@megaloja.com', type: 'retail', plan: 'pro', status: 'active', 
            metrics: { products: 1250, orders: 450, storageUsedMB: 450, storageLimitMB: 1000 }, 
            joinedAt: '12/01/2026' 
        },
        { 
            id: '2', name: 'Burger King Franquia', ownerEmail: 'gerente@bk.com', type: 'food', plan: 'enterprise', status: 'active', 
            metrics: { products: 120, orders: 3500, storageUsedMB: 850, storageLimitMB: 5000 }, 
            joinedAt: '15/01/2026' 
        },
        { 
            id: '3', name: 'Mercadinho da Esquina', ownerEmail: 'ze@gmail.com', type: 'retail', plan: 'free', status: 'trial', 
            metrics: { products: 50, orders: 12, storageUsedMB: 10, storageLimitMB: 100 }, 
            joinedAt: '10/02/2026' 
        },
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Cálculos de UI
    const getUsageColor = (used: number, limit: number) => {
        const pct = (used / limit) * 100;
        if (pct > 90) return 'bg-red-500';
        if (pct > 70) return 'bg-yellow-500';
        return 'bg-blue-500';
    };

    const handleEdit = (store: StoreData) => {
        setSelectedStore(store);
        setIsEditModalOpen(true);
    };

    const handleSavePlan = () => {
        // Aqui atualizaria no Firebase
        if (selectedStore) {
            const updatedStores = stores.map(s => s.id === selectedStore.id ? selectedStore : s);
            setStores(updatedStores);
            setIsEditModalOpen(false);
        }
    };

    return (
        <div className="p-8 space-y-6">
            {/* Header de Ação */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Gerenciar Estabelecimentos</h2>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nome, email ou ID..." 
                            className="pl-10 pr-4 py-2 border rounded-lg w-80 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-600">
                        <Filter size={18} /> Filtros
                    </button>
                </div>
            </div>

            {/* Tabela Avançada */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Estabelecimento</th>
                            <th className="p-4">Plano & Status</th>
                            <th className="p-4">Uso de Recursos (Storage)</th>
                            <th className="p-4">Volume (Dados)</th>
                            <th className="p-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stores.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(store => (
                            <tr key={store.id} className="border-t hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-gray-800">{store.name}</div>
                                    <div className="text-xs text-gray-500">{store.ownerEmail}</div>
                                    <span className={`mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${store.type === 'food' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {store.type}
                                    </span>
                                </td>
                                
                                <td className="p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CreditCard size={14} className="text-gray-400" />
                                        <span className="font-bold text-sm capitalize">{store.plan}</span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${store.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {store.status === 'active' ? 'Ativo' : 'Trial / Bloqueado'}
                                    </span>
                                </td>

                                <td className="p-4 w-64">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-500 flex items-center gap-1"><Server size={10}/> Storage</span>
                                        <span className="font-medium">{store.metrics.storageUsedMB}MB / {store.metrics.storageLimitMB}MB</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full ${getUsageColor(store.metrics.storageUsedMB, store.metrics.storageLimitMB)}`} 
                                            style={{ width: `${(store.metrics.storageUsedMB / store.metrics.storageLimitMB) * 100}%` }}
                                        ></div>
                                    </div>
                                </td>

                                <td className="p-4">
                                    <div className="text-sm text-gray-600 flex items-center gap-2">
                                        <Box size={14} /> {store.metrics.products} Produtos
                                    </div>
                                    <div className="text-sm text-gray-600 flex items-center gap-2">
                                        <Database size={14} /> {store.metrics.orders} Pedidos
                                    </div>
                                </td>

                                <td className="p-4 text-center">
                                    <button 
                                        onClick={() => handleEdit(store)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Gerenciar Loja"
                                    >
                                        <Edit size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Edição / Atribuição de Plano */}
            {selectedStore && (
                <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Gerenciar: ${selectedStore.name}`}>
                    <div className="p-6 space-y-6">
                        {/* Status de Saúde */}
                        <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center">
                            <div>
                                <h4 className="font-bold flex items-center gap-2"><Activity size={18}/> Health Score</h4>
                                <p className="text-xs text-slate-400">Baseado em atividade recente</p>
                            </div>
                            <div className="text-3xl font-bold text-green-400">92/100</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Plano de Assinatura">
                                <select 
                                    className="w-full border p-2 rounded-lg font-medium"
                                    value={selectedStore.plan}
                                    onChange={e => setSelectedStore({...selectedStore, plan: e.target.value as any})}
                                >
                                    <option value="free">Grátis (Free)</option>
                                    <option value="pro">Profissional (Pro)</option>
                                    <option value="ultra">Ultra Network</option>
                                    <option value="enterprise">Enterprise (Corporativo)</option>
                                </select>
                            </FormField>
                            
                            <FormField label="Status da Conta">
                                <select 
                                    className="w-full border p-2 rounded-lg"
                                    value={selectedStore.status}
                                    onChange={e => setSelectedStore({...selectedStore, status: e.target.value as any})}
                                >
                                    <option value="active">Ativo</option>
                                    <option value="trial">Em Teste (Trial)</option>
                                    <option value="blocked">Bloqueado (Inadimplente)</option>
                                </select>
                            </FormField>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <Server size={18}/> Limites de Recursos (Override)
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Limite de Armazenamento (MB)">
                                    <input 
                                        type="number" 
                                        className="w-full border p-2 rounded" 
                                        value={selectedStore.metrics.storageLimitMB}
                                        onChange={e => setSelectedStore({
                                            ...selectedStore, 
                                            metrics: { ...selectedStore.metrics, storageLimitMB: Number(e.target.value) }
                                        })}
                                    />
                                </FormField>
                                <FormField label="Limite de Produtos">
                                    <input type="number" className="w-full border p-2 rounded" placeholder="Ilimitado" />
                                </FormField>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                * Alterar estes valores substitui o padrão do plano selecionado.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                            <button onClick={handleSavePlan} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};