import React, { useState } from 'react';
import { Modal } from '../../../ui/Modal';
import { Star, CheckCircle } from 'lucide-react';

const StarRating = ({ rating = 0, reviewCount = 0 }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
        <div className="flex items-center gap-1 text-yellow-500">
            {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} size={16} fill="currentColor" />)}
            {halfStar && <Star size={16} />}
            {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} size={16} />)}
            <span className="text-gray-500 text-xs ml-1">({reviewCount})</span>
        </div>
    );
};

export const ExtensionDetailModal: React.FC<any> = ({ isOpen, onClose, extension, onAcquire, isActivated }) => {
    if (!isOpen || !extension) return null;

    const [activeTab, setActiveTab] = useState('description');

    interface MetadataItemProps {
        label: string;
        children: React.ReactNode;
    }

    const MetadataItem: React.FC<MetadataItemProps> = ({ label, children }) => (
        <div className="flex justify-between py-2 border-b border-gray-200">
            <dt className="text-sm font-semibold text-gray-600">{label}:</dt>
            <dd className="text-sm text-gray-800 text-right">{children}</dd>
        </div>
    );

    const tabs = [
        { key: 'description', label: 'Descrição' },
        { key: 'installation', label: 'Instalação' },
        { key: 'faq', label: 'FAQ' },
        { key: 'changelog', label: 'Alterações' },
        { key: 'screenshots', label: 'Telas' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={extension.name} size="5xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna Esquerda: Conteúdo com Abas */}
                <div className="lg:col-span-2">
                    <nav className="flex space-x-4 border-b border-gray-200 mb-4">
                        {tabs.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`py-3 px-1 text-sm font-semibold ${activeTab === tab.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                    <div className="prose max-w-none text-gray-700">
                        {activeTab === 'description' && <div dangerouslySetInnerHTML={{ __html: extension.description_long || '<p>Nenhuma descrição detalhada fornecida.</p>' }} />}
                        {activeTab === 'installation' && <div dangerouslySetInnerHTML={{ __html: extension.installation_guide || '<p>Nenhum guia de instalação fornecido.</p>' }} />}
                        {activeTab === 'faq' && <div dangerouslySetInnerHTML={{ __html: extension.faq || '<p>Nenhuma pergunta frequente fornecida.</p>' }} />}
                        {activeTab === 'changelog' && <div dangerouslySetInnerHTML={{ __html: extension.changelog || '<p>Nenhum registro de alterações fornecido.</p>' }} />}
                        {activeTab === 'screenshots' && (
                            <div className="grid grid-cols-2 gap-4 not-prose">
                                {extension.screenshots?.filter((s: string) => s).length > 0 ? (
                                    extension.screenshots.map((url: string, i: number) => <img key={i} src={url} alt={`Screenshot ${i + 1}`} className="rounded-md shadow-md" />)
                                ) : <p>Nenhuma tela foi fornecida.</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Coluna Direita: Metadados e Ações */}
                <div className="lg:col-span-1 space-y-6">
                    {extension.mediaAssets?.banner && <img src={extension.mediaAssets.banner} alt="Banner" className="rounded-md shadow-lg w-full" />}
                    <button
                        onClick={() => onAcquire(extension)}
                        disabled={isActivated}
                        className={`w-full py-3 rounded-md font-bold text-lg transition flex items-center justify-center gap-2 ${isActivated ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                        {isActivated ? <><CheckCircle size={20}/> Instalado</> : 'Instalar Agora'}
                    </button>
                    <dl className="bg-gray-50 p-4 rounded-lg border">
                        <MetadataItem label="Versão">{extension.version || 'N/A'}</MetadataItem>
                        <MetadataItem label="Autor">{extension.author || 'N/A'}</MetadataItem>
                        <MetadataItem label="Última atualização">{extension.lastUpdated || 'N/A'}</MetadataItem>
                        <MetadataItem label="Instalações Ativas">{(extension.activeInstalls || 0).toLocaleString('pt-BR')}+</MetadataItem>
                    </dl>
                </div>
            </div>
        </Modal>
    );
};