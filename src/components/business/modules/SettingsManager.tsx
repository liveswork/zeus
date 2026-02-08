import React, { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Cog, Save,  Printer, MessageSquare, HelpCircle } from 'lucide-react';
import { useBusiness } from '../../../contexts/BusinessContext';
//import { useUI } from '../../../contexts/UIContext';
// import { FormField } from '../../ui/FormField';
import { WhatsappManager } from './whatsapp/WhatsappManager';
import { toast } from "react-hot-toast";
// Assumindo que o PrinterManager estará em um arquivo separado
// import { PrinterManager } from './printers/PrinterManager';

// --- Componentes Internos Simples (para resolver erros de "não encontrado") ---

const PlaceholderComponent: React.FC<{ title: string }> = ({ title }) => (
    <div className="text-center p-10 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-semibold text-gray-500">Aba de "{title}"</h3>
        <p className="text-gray-400 mt-2">Este módulo de configurações está em desenvolvimento.</p>
    </div>
);

const SettingsCheckbox: React.FC<{ id: string, label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; tooltip?: string }> = ({ id, label, checked, onChange, tooltip }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
        <label htmlFor={id} className="flex items-center cursor-pointer">
            <span className="text-gray-700">{label}</span>
            {tooltip && (
                <div className="relative flex items-center group ml-2">
                    <HelpCircle size={16} className="text-gray-400 cursor-help" />
                    <div className="absolute bottom-full mb-2 w-72 bg-gray-800 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                        {tooltip}
                    </div>
                </div>
            )}
        </label>
        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
            <input
                type="checkbox"
                name={id}
                id={id}
                checked={checked}
                onChange={onChange}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
            />
            <label htmlFor={id} className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
        </div>
    </div>
);

// --- Componente da Aba "Geral" (definido aqui para organização) ---
const GeneralTab: React.FC<{ settings: any, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ settings, onChange }) => (
    <div className="bg-gray-50 p-4 rounded-md">
        <SettingsCheckbox
            id="allowOnlineOrders"
            label="Permitir pedidos online"
            checked={settings.allowOnlineOrders}
            onChange={onChange}
        />
        <SettingsCheckbox
            id="autoConfirmOrders"
            label="Confirmar pedidos automaticamente"
            checked={settings.autoConfirmOrders}
            onChange={onChange}
        />
        <SettingsCheckbox
            id="requireCustomerPhone"
            label="Exigir telefone do cliente no checkout"
            checked={settings.requireCustomerPhone}
            onChange={onChange}
        />
    </div>
);


// --- Componente Principal ---
export const SettingsManager: React.FC = () => {
    const { businessId } = useBusiness();
    // const { showAlert } = useUI();

    const [activeTab, setActiveTab] = useState('whatsapp'); // Inicia na aba de WhatsApp
    const [loading, setLoading] = useState(false);

    // Estado inicial padrão e robusto para as configurações
    const [settings, setSettings] = useState({
        general: {
            allowOnlineOrders: true,
            autoConfirmOrders: false,
            requireCustomerPhone: true
        }
    });

    // Efeito para carregar as configurações do Firestore
    useEffect(() => {
        if (!businessId) return;
        setLoading(true);
        const settingsRef = doc(db, 'users', businessId, 'configuration', 'mainSettings');
        const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                // Mescla as configurações do banco com as padrões para evitar erros
                const dbSettings = docSnap.data();
                setSettings(prev => ({
                    ...prev,
                    ...dbSettings,
                    general: { ...prev.general, ...(dbSettings.general || {}) }
                }));
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [businessId]);

    // Função ÚNICA para lidar com todas as mudanças de checkbox
    const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked, type } = e.target;
        const value = type === 'checkbox' ? checked : e.target.value;

        // Encontra a qual "seção" (aba) a configuração pertence
        const section = Object.keys(settings).find(key => 
            typeof settings[key as keyof typeof settings] === 'object' &&
            settings[key as keyof typeof settings] !== null &&
            name in settings[key as keyof typeof settings]
        );

        if (section) {
            setSettings(prev => ({
                ...prev,
                [section]: {
                    ...(prev[section as keyof typeof prev] as object),
                    [name]: value
                }
            }));
        }
    };

    const handleSave = async () => {
        if (!businessId) {
            toast.error("ID do negócio não encontrado. Não é possível salvar.");
            return;
        }
        setLoading(true);
        try {
            const settingsRef = doc(db, 'users', businessId, 'configuration', 'mainSettings');
            await setDoc(settingsRef, settings, { merge: true });
            toast.success("Configurações salvas com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar:", error)
            toast.error("Erro ao salvar configurações.");
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'geral', label: 'Negócio', icon: <Cog size={18} /> },
        { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={18} /> },
        { id: 'impressao', label: 'Impressão', icon: <Printer size={18} /> },
        // Outras abas que você pode reativar no futuro
    ];

    // Mapa de componentes para renderizar o conteúdo de cada aba
    const settingsComponentMap: { [key: string]: React.ReactNode } = {
        'geral': <GeneralTab settings={settings.general} onChange={handleSettingChange} />,
        'whatsapp': <WhatsappManager />,
        // 'impressao': <PrinterManager />, // Descomente quando o componente existir
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Configurações do Sistema</h1>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-green-700 transition disabled:bg-gray-400"
                >
                    <Save size={20} className="mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`${
                                    activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Renderiza o componente da aba ativa usando o mapa */}
                {loading ? <p>Carregando...</p> : (settingsComponentMap[activeTab] || <PlaceholderComponent title={activeTab} />)}
            </div>
        </div>
    );
};