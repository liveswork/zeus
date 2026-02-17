import React, { useState } from 'react';
import { useStoreSettings } from '../../../../../hooks/useStoreSettings'; 
import { Monitor, Smartphone, Plus, X, Loader, Save, CheckCircle, AlertCircle, Layout, Image as ImageIcon, Settings } from 'lucide-react';

export const RetailStoreAppearance: React.FC = () => {
    const { config, setConfig, handleUpload, handleSave, saving, slugAvailable, checkSlug, checkingSlug } = useStoreSettings();
    const [activeDevice, setActiveDevice] = useState<'mobile' | 'desktop'>('desktop');
    
    // ✅ ABA ATIVA
    const [activeTab, setActiveTab] = useState('banners');

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string, isArray: boolean) => {
        if (e.target.files?.[0]) handleUpload(e.target.files[0], field, isArray);
    };

    const removeBanner = (field: string, index: number) => {
        const arr = config[field as keyof typeof config] as string[];
        const newArr = arr.filter((_, i) => i !== index);
        setConfig(prev => ({ ...prev, [field]: newArr }));
    };

    const tabs = [
        { id: 'banners', label: 'Banners & Sliders', icon: ImageIcon },
        { id: 'identity', label: 'Identidade Visual', icon: Layout },
        { id: 'settings', label: 'Configurações', icon: Settings },
    ];

    return (
        <div className="flex flex-col xl:flex-row gap-6 p-6 h-[calc(100vh-80px)]">
            
            {/* ESQUERDA: MENU + FORM */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex overflow-hidden">
                
                {/* MENU LATERAL */}
                <div className="w-64 border-r border-gray-100 bg-gray-50/50 flex flex-col">
                    <div className="p-5 border-b border-gray-100">
                        <h2 className="font-bold text-gray-800">Loja Virtual</h2>
                        <p className="text-xs text-gray-500">Vitrine online</p>
                    </div>
                    <nav className="flex-1 p-2 space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                                    activeTab === tab.id 
                                        ? 'bg-white text-blue-600 shadow-sm border border-gray-100' 
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 border-t">
                        <button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold flex justify-center gap-2 shadow-sm text-sm">
                            {saving ? <Loader size={16} className="animate-spin"/> : <Save size={16}/>} Salvar Loja
                        </button>
                    </div>
                </div>

                {/* CONTEÚDO */}
                <div className="flex-1 p-8 overflow-y-auto bg-white">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-gray-800">{tabs.find(t => t.id === activeTab)?.label}</h3>
                        <div className="flex bg-gray-100 rounded-lg p-1 border">
                            <button onClick={() => setActiveDevice('mobile')} className={`p-1.5 rounded ${activeDevice === 'mobile' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}><Smartphone size={16}/></button>
                            <button onClick={() => setActiveDevice('desktop')} className={`p-1.5 rounded ${activeDevice === 'desktop' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}><Monitor size={16}/></button>
                        </div>
                    </div>

                    {activeTab === 'banners' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3">
                                <ImageIcon className="text-blue-500 mt-1 flex-shrink-0" size={20}/>
                                <div>
                                    <h4 className="font-bold text-blue-900 text-sm">Gerenciando Banners {activeDevice === 'desktop' ? 'Desktop' : 'Mobile'}</h4>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Use {activeDevice === 'desktop' ? '1920x600px' : '800x1000px'} para melhor qualidade.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {(activeDevice === 'desktop' ? config.retailBannersDesktop : config.retailBannersMobile).map((url, i) => (
                                    <div key={i} className="relative group border rounded-lg overflow-hidden h-32 bg-gray-100">
                                        <img src={url} className="w-full h-full object-cover" />
                                        <button onClick={() => removeBanner(activeDevice === 'desktop' ? 'retailBannersDesktop' : 'retailBannersMobile', i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow">
                                            <X size={12}/>
                                        </button>
                                    </div>
                                ))}
                                <label className="border-2 border-dashed rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition">
                                    <Plus size={24} className="mb-2"/>
                                    <span className="text-xs font-bold">Adicionar Banner</span>
                                    <input type="file" hidden onChange={(e) => onFileChange(e, activeDevice === 'desktop' ? 'retailBannersDesktop' : 'retailBannersMobile', true)} />
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'identity' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2">Cor da Marca</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={config.primaryColor} onChange={(e) => setConfig({...config, primaryColor: e.target.value})} className="h-10 w-10 cursor-pointer rounded shadow-sm border-none"/>
                                        <input value={config.primaryColor} readOnly className="flex-1 border p-2 rounded bg-gray-50 text-sm font-mono"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">Logo</label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-16 rounded border overflow-hidden bg-gray-100 flex items-center justify-center">
                                            {config.logoUrl ? <img src={config.logoUrl} className="w-full h-full object-cover"/> : <Settings size={20} className="text-gray-300"/>}
                                        </div>
                                        <label className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded cursor-pointer font-medium text-gray-700">
                                            Alterar <input type="file" hidden onChange={(e) => onFileChange(e, 'logoUrl', false)} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Slogan</label>
                                <input value={config.description} onChange={e => setConfig({...config, description: e.target.value})} className="w-full border p-3 rounded-lg text-sm" placeholder="Ex: Moda para todos os estilos"/>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div>
                                <label className="block text-sm font-bold mb-2">Link da Loja</label>
                                <div className="flex items-center">
                                    <span className="bg-gray-100 border border-r-0 rounded-l px-3 py-3 text-sm text-gray-500">nexus.app/loja/</span>
                                    <input value={config.slug} onChange={(e) => { const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''); setConfig({...config, slug: v}); checkSlug(v); }} className="flex-1 border p-3 rounded-r outline-none font-bold text-gray-800"/>
                                    <div className="ml-3">
                                        {checkingSlug && <Loader size={20} className="animate-spin text-gray-400"/>}
                                        {!checkingSlug && slugAvailable === true && <CheckCircle size={24} className="text-green-500"/>}
                                        {!checkingSlug && slugAvailable === false && <AlertCircle size={24} className="text-red-500"/>}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 border rounded-xl">
                                <div>
                                    <h4 className="font-bold">Loja Ativa</h4>
                                    <p className="text-xs text-gray-500">Desative para entrar em modo manutenção.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={config.isActive} onChange={e => setConfig({...config, isActive: e.target.checked})} className="sr-only peer"/>
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* DIREITA: PREVIEW */}
            <div className="w-[400px] bg-gray-100 rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center relative">
                <div className="absolute top-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Preview {activeDevice}
                </div>
                <div className={`transition-all duration-500 bg-white border-8 border-gray-900 shadow-2xl overflow-hidden relative flex flex-col ${
                    activeDevice === 'mobile' ? 'w-[320px] h-[640px] rounded-[40px]' : 'w-[95%] h-[280px] rounded-xl mt-8' 
                }`}>
                    <div className="bg-gray-200 relative overflow-hidden group" style={{height: activeDevice === 'mobile' ? '180px' : '100%'}}>
                        {(activeDevice === 'mobile' ? config.retailBannersMobile : config.retailBannersDesktop)[0] ? (
                            <img src={(activeDevice === 'mobile' ? config.retailBannersMobile : config.retailBannersDesktop)[0]} className="w-full h-full object-cover"/>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                <Monitor size={24} className="mb-2 opacity-20"/>
                                <span className="text-[10px] font-medium">Sem Banner</span>
                            </div>
                        )}
                    </div>
                    {/* Grid Simulado */}
                    <div className="flex-1 p-4 bg-gray-50 overflow-hidden">
                        <div className={`grid gap-2 ${activeDevice === 'desktop' ? 'grid-cols-4' : 'grid-cols-2'}`}>
                            {[1, 2, 3, 4].map(n => (
                                <div key={n} className="bg-white rounded p-2 shadow-sm flex flex-col h-32">
                                    <div className="flex-1 bg-gray-100 rounded mb-2"></div>
                                    <div className="h-2 w-2/3 bg-gray-200 rounded"></div>
                                    <div className="text-[10px] font-bold mt-1" style={{color: config.primaryColor}}>R$ 129,90</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};