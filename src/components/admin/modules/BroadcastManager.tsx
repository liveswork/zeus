import React, { useState } from 'react';
import { MessageSquare, Image, Tag, PlusCircle, BrainCircuit, UploadCloud, Edit, Trash2 } from 'lucide-react';
import { useUI } from '../../../contexts/UIContext';
import { Modal } from '../../ui/Modal';
import { FormField } from '../../ui/FormField';

// --- COMPONENTES INTERNOS PARA CADA ABA ---

const BroadcastListsTab = () => {
    const { showAlert } = useUI();
    // Dados mocados para visualização
    const [lists, setLists] = useState([
        { id: '1', title: 'Promoções da Semana 🍕', description: 'Uma lista focada em ofertas semanais para engajar clientes recorrentes.', schedule: 'Toda Segunda, 10:00' },
        { id: '2', title: 'Novidades do Cardápio ✨', description: 'Anuncie lançamentos e pratos sazonais para surpreender seus clientes.', schedule: 'Primeiro dia do mês, 18:00' }
    ]);

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-blue-700">
                    <PlusCircle size={18} className="mr-2" /> Nova Lista
                </button>
            </div>
            {lists.map(list => (
                <div key={list.id} className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-800">{list.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{list.description}</p>
                    <p className="text-xs text-blue-600 font-semibold mt-2">Horário: {list.schedule}</p>
                    <div className="flex justify-end gap-2 mt-2">
                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><Edit size={16} /></button>
                        <button className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const MediaLibraryTab = () => {
    // Dados mocados para visualização
    const segments = ['Pizzaria', 'Açaiteria', 'Hamburgueria', 'Restaurante', 'Pastelaria', 'Espetaria'];
    const [selectedSegment, setSelectedSegment] = useState('Pizzaria');

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                 <h3 className="text-lg font-semibold">Segmentos</h3>
                 <button className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-blue-700">
                    <PlusCircle size={18} className="mr-2" /> Novo Segmento
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {segments.map(seg => (
                    <button key={seg} onClick={() => setSelectedSegment(seg)} className={`px-3 py-1 rounded-full text-sm font-medium ${selectedSegment === seg ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                        {seg}
                    </button>
                ))}
            </div>
            <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Imagens para: <span className="text-blue-600">{selectedSegment}</span></h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Placeholder para imagens */}
                    <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                        <Image size={32} />
                    </div>
                    <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                        <Image size={32} />
                    </div>
                     <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50">
                        <UploadCloud size={32}/>
                        <span className="text-xs mt-2">Adicionar Imagem</span>
                    </div>
                </div>
            </div>
        </div>
    );
}


// --- COMPONENTE PRINCIPAL ---

export const BroadcastManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState('lists');

    const tabs = [
        { id: 'lists', label: 'Listas de Transmissão', icon: <MessageSquare size={18} /> },
        { id: 'media', label: 'Biblioteca de Mídia', icon: <Image size={18} /> },
        { id: 'segments', label: 'Segmentos de Clientes', icon: <Tag size={18} /> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Nexus Marketing Studio</h1>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-6">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition ${
                                    activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {activeTab === 'lists' && <BroadcastListsTab />}
                {activeTab === 'media' && <MediaLibraryTab />}
                {activeTab === 'segments' && <p>Gerenciamento de segmentos de clientes (ex: Clientes VIP, Clientes Inativos) será implementado aqui.</p>}
            </div>
        </div>
    );
};