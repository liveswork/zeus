import React, { useState } from 'react';
import { useStoreSettings } from '../../../../../hooks/useStoreSettings';
import { Save, Loader, Upload, Smartphone, Monitor, CheckCircle, AlertCircle, Layout, Palette, FileText, ToggleLeft, Link as LinkIcon } from 'lucide-react';

export const FoodStoreAppearance: React.FC = () => {
    const { config, setConfig, handleUpload, handleSave, saving, slugAvailable, checkSlug, checkingSlug } = useStoreSettings();
    const [activeDevice, setActiveDevice] = useState<'mobile' | 'desktop'>('mobile');
    
    // ✅ ESTADO DA ABA ATIVA
    const [activeTab, setActiveTab] = useState('settings');

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        if (e.target.files?.[0]) handleUpload(e.target.files[0], field, false);
    };

    // Definição das Abas
    const tabs = [
        { id: 'settings', label: 'Configurações', icon: ToggleLeft },
        { id: 'appearance', label: 'Cor e Capa', icon: Palette },
        { id: 'info', label: 'Descrição e Rodapé', icon: FileText },
        { id: 'link', label: 'Link do Cardápio', icon: LinkIcon },
    ];

    return (
        <div className="flex flex-col xl:flex-row gap-6 p-6 h-[calc(100vh-80px)]">
            
            {/* --- BLOCO ESQUERDO (MENU + FORMULÁRIO) --- */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex overflow-hidden">
                
                {/* 1. MENU LATERAL (ABAS) */}
                <div className="w-64 border-r border-gray-100 bg-gray-50/50 flex flex-col">
                    <div className="p-5 border-b border-gray-100">
                        <h2 className="font-bold text-gray-800">Personalizar</h2>
                        <p className="text-xs text-gray-500">Gestão do cardápio</p>
                    </div>
                    <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                                    activeTab === tab.id 
                                        ? 'bg-white text-blue-600 shadow-sm border border-gray-100' 
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-gray-100">
                        <button 
                            onClick={handleSave} 
                            disabled={saving} 
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 shadow-sm text-sm transition"
                        >
                            {saving ? <Loader size={16} className="animate-spin"/> : <Save size={16}/>}
                            Salvar Tudo
                        </button>
                    </div>
                </div>

                {/* 2. ÁREA DE FORMULÁRIO (CONTEÚDO DA ABA) */}
                <div className="flex-1 p-8 overflow-y-auto bg-white">
                    
                    {/* Header da Aba */}
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-gray-800">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h3>
                        {/* Toggle Mobile/Desktop Global */}
                        <div className="flex bg-gray-100 rounded-lg p-1 border">
                            <button onClick={() => setActiveDevice('mobile')} className={`p-1.5 rounded ${activeDevice === 'mobile' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}><Smartphone size={16}/></button>
                            <button onClick={() => setActiveDevice('desktop')} className={`p-1.5 rounded ${activeDevice === 'desktop' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}><Monitor size={16}/></button>
                        </div>
                    </div>

                    {/* --- CONTEÚDO CONDICIONAL --- */}
                    
                    {activeTab === 'settings' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="border rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-800">Cardápio Ativado</h4>
                                    <p className="text-sm text-gray-500">Se desativado, clientes verão "Fechado".</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={config.isActive} onChange={e => setConfig({...config, isActive: e.target.checked})} className="sr-only peer"/>
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>

                            <div className="border rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-800">Aceitar Pedidos Online</h4>
                                    <p className="text-sm text-gray-500">Permitir que enviem o pedido para o WhatsApp.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={config.allowOrders} onChange={e => setConfig({...config, allowOrders: e.target.checked})} className="sr-only peer"/>
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="border rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-800">Mostrar Produtos Esgotados</h4>
                                    <p className="text-sm text-gray-500">Exibe produtos sem estoque como "Indisponível".</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={config.showOutOfStock} onChange={e => setConfig({...config, showOutOfStock: e.target.checked})} className="sr-only peer"/>
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Capa da Loja</label>
                                <div className="relative h-48 bg-gray-100 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden group hover:border-blue-400 transition">
                                    {config.foodCoverUrl ? (
                                        <>
                                            <img src={config.foodCoverUrl} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <span className="text-white text-xs font-bold border border-white px-3 py-1 rounded-full">Alterar</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <Upload className="mx-auto mb-1 opacity-50"/>
                                            <span className="text-xs">Clique para adicionar capa</span>
                                        </div>
                                    )}
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => onFileChange(e, 'foodCoverUrl')} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Logo</label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-20 h-20 bg-gray-100 rounded-full border flex items-center justify-center overflow-hidden group">
                                            {config.logoUrl ? <img src={config.logoUrl} className="w-full h-full object-cover"/> : <Upload size={20} className="text-gray-400"/>}
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => onFileChange(e, 'logoUrl')} />
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            <p>Recomendado:</p>
                                            <p>500x500px (Quadrado)</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Cor Principal</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={config.primaryColor} onChange={(e) => setConfig({...config, primaryColor: e.target.value})} className="h-10 w-10 cursor-pointer border-none rounded shadow-sm"/>
                                        <div className="flex-1 border rounded px-3 flex items-center bg-gray-50 text-sm font-mono text-gray-600">
                                            {config.primaryColor}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">Usada em botões e destaques.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Descrição da Loja</label>
                                <textarea 
                                    className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" 
                                    rows={4} 
                                    placeholder="Conte um pouco sobre sua história, especialidades e horários."
                                    value={config.description}
                                    onChange={e => setConfig({...config, description: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Texto do Rodapé</label>
                                <input 
                                    className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="Ex: Endereço, CNPJ ou frase de efeito."
                                    value={config.footerText}
                                    onChange={e => setConfig({...config, footerText: e.target.value})}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'link' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
                                <label className="block text-sm font-bold text-blue-900 mb-2">Link do seu Cardápio</label>
                                <div className="flex items-center justify-center mb-4">
                                    <span className="bg-white border border-r-0 rounded-l-lg px-4 py-3 text-gray-500 font-mono text-sm">nexus.app/menu/</span>
                                    <input 
                                        value={config.slug}
                                        onChange={(e) => {
                                            const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                            setConfig({...config, slug: v});
                                            checkSlug(v);
                                        }}
                                        className={`w-48 border border-l-0 rounded-r-lg px-4 py-3 outline-none font-bold text-gray-800 ${slugAvailable === false ? 'border-red-500 text-red-600' : 'border-gray-200'}`}
                                    />
                                    <div className="ml-3">
                                        {checkingSlug && <Loader size={20} className="animate-spin text-gray-400"/>}
                                        {!checkingSlug && slugAvailable === true && <CheckCircle size={24} className="text-green-500"/>}
                                        {!checkingSlug && slugAvailable === false && <AlertCircle size={24} className="text-red-500"/>}
                                    </div>
                                </div>
                                {slugAvailable === false && <p className="text-sm text-red-500 font-medium">Este link já está em uso.</p>}
                                <p className="text-xs text-blue-600 mt-2">Compartilhe este link no seu Instagram e WhatsApp!</p>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* --- BLOCO DIREITO (PREVIEW) --- */}
            <div className="w-[400px] bg-gray-100 rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center relative">
                <div className="absolute top-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                    VISUALIZAÇÃO {activeDevice}
                </div>

                {/* MOCKUP DEVICE */}
                <div className={`transition-all duration-500 bg-white border-[8px] border-gray-900 shadow-2xl overflow-hidden relative flex flex-col ${
                    activeDevice === 'mobile' 
                        ? 'w-[320px] h-[640px] rounded-[40px]' 
                        : 'w-[95%] h-[280px] rounded-xl mt-8'
                }`}>
                    {/* Header */}
                    <div className={`${activeDevice === 'mobile' ? 'h-36' : 'h-40'} bg-gray-800 relative transition-all`}>
                        {config.foodCoverUrl && <img src={config.foodCoverUrl} className="w-full h-full object-cover opacity-90"/>}
                        
                        <div className={`absolute border-4 border-white bg-white overflow-hidden shadow-lg z-10 transition-all duration-500
                            ${activeDevice === 'mobile' 
                                ? '-bottom-10 left-1/2 transform -translate-x-1/2 w-24 h-24 rounded-full' 
                                : 'bottom-4 left-6 w-24 h-24 rounded-lg'
                            }`}
                        >
                            {config.logoUrl ? <img src={config.logoUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">Logo</div>}
                        </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 px-5 bg-gray-50 overflow-hidden overflow-y-auto no-scrollbar">
                        <div className={`mt-2 mb-6 ${activeDevice === 'mobile' ? 'pt-12 text-center' : 'pl-28 pt-2 text-left'}`}>
                            <h3 className="font-bold text-gray-900 text-lg leading-tight">Império Pizzaria</h3>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{config.description || 'As melhores pizzas da região...'}</p>
                            
                            {/* Badges de Status (Configurações) */}
                            <div className={`flex gap-2 mt-2 ${activeDevice === 'mobile' ? 'justify-center' : ''}`}>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${config.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {config.isActive ? 'ABERTO' : 'FECHADO'}
                                </span>
                                {config.allowOrders && <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">DELIVERY</span>}
                            </div>
                        </div>

                        {/* List Items Skeleton */}
                        <div className={`space-y-3 pb-4 ${activeDevice === 'desktop' ? 'grid grid-cols-2 gap-3 space-y-0' : ''}`}>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3">
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-2 w-full bg-gray-100 rounded"></div>
                                        <div className="text-xs font-bold" style={{color: config.primaryColor}}>R$ 45,90</div>
                                    </div>
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Footer Mobile */}
                    {activeDevice === 'mobile' && (
                        <div className="absolute bottom-6 right-6 w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-white transition-transform hover:scale-110" style={{backgroundColor: config.primaryColor}}>
                            <Smartphone size={20}/>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};