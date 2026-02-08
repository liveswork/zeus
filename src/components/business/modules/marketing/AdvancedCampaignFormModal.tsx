import React, { useState, useMemo } from 'react';
import { Modal } from '../../../ui/Modal';
import { ShoppingCart, Eye, Users, Building, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';

// Este é o modal inteligente que permite ao usuário escolher o objetivo da campanha antes de criá-la.

// Exportando os objetivos para serem usados em outros lugares
export const businessCampaignObjectives = [
    {
        key: 'cpa',
        title: 'Gerar Vendas',
        description: 'Incentive os Impulsionadores a divulgar seus produtos. Você paga uma comissão somente quando uma venda é realizada através do link deles.',
        icon: <ShoppingCart size={40} />,
        goodFor: [
            'Aumentar o faturamento direto',
            'Validar a atratividade de uma oferta',
            'Criar uma rede de vendedores comissionados'
        ]
    },
    {
        key: 'cpm',
        title: 'Aumentar Visibilidade',
        description: 'Faça sua loja aparecer em destaque no topo das buscas e em áreas nobres da plataforma. Você paga por cada mil visualizações.',
        icon: <Eye size={40} />,
        goodFor: [
            'Fortalecimento de marca (Branding)',
            'Anunciar novidades ou eventos',
            'Alcançar o maior número de clientes possível'
        ]
    }
];

export const supplierCampaignObjectives = [
    {
        key: 'cpi',
        title: 'Engajar Influenciadores',
        description: 'Incentive os Impulsionadores a aceitarem sua campanha. Você paga um valor fixo para cada um que se compromete a divulgar sua marca/produto.',
        icon: <Users size={40} />,
        goodFor: [
            'Construir uma base de divulgadores',
            'Aumentar o alcance em redes sociais',
            'Gerar "buzz" sobre um novo produto'
        ]
    },
    {
        key: 'cpm',
        title: 'Alcançar Restaurantes',
        description: 'Exiba seus anúncios em locais estratégicos dentro do painel dos restaurantes, como banners e pop-ups.',
        icon: <Building size={40} />,
        goodFor: [
            'Apresentar seus produtos a novos compradores B2B',
            'Anunciar promoções de insumos',
            'Fortalecer sua marca no setor'
        ]
    },
    {
        key: 'low_stock_alert',
        title: 'Alerta de Estoque Baixo (CPC)',
        description: 'Anuncie seu produto no exato momento em que um restaurante precisa dele. Você paga apenas quando o restaurante clica na sua oferta.',
        icon: <AlertTriangle size={40} />,
        goodFor: [
            'Vendas B2B de alta conversão',
            'Fidelizar clientes existentes',
            'Ser a primeira opção na hora da reposição'
        ]
    }
];


interface AdvancedCampaignFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onObjectiveSelect: (key: string) => void;
    objectives: typeof businessCampaignObjectives | typeof supplierCampaignObjectives;
    entityType: 'business' | 'supplier' | 'loja' | 'restaurante';
}

export const AdvancedCampaignFormModal: React.FC<AdvancedCampaignFormModalProps> = ({ isOpen, onClose, onObjectiveSelect, objectives, entityType }) => {

    const [selectedObjective, setSelectedObjective] = useState(objectives[0].key);
    const [hoveredObjective, setHoveredObjective] = useState<string | null>(null);

    const objectiveToDisplay = useMemo(() => {
        const keyToShow = hoveredObjective || selectedObjective;
        return objectives.find(o => o.key === keyToShow);
    }, [hoveredObjective, selectedObjective, objectives]);

    const handleNext = () => {
        onObjectiveSelect(selectedObjective);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Nova Campanha para ${entityType === 'business' ? 'o seu Negócio' : 'o seu Fornecimento'}`}
            size="4xl"
        >
            <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-2/5 space-y-3">
                    <h3 className="font-bold text-gray-700 mb-2">1. Escolha um objetivo</h3>
                    {objectives.map(obj => (
                        <div
                            key={obj.key}
                            onClick={() => setSelectedObjective(obj.key)}
                            onMouseEnter={() => setHoveredObjective(obj.key)}
                            onMouseLeave={() => setHoveredObjective(null)}
                            className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${selectedObjective === obj.key ? 'bg-blue-50 border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                             <div className="text-blue-600">
                                 {React.cloneElement(obj.icon, { size: 24 })}
                             </div>
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    name="campaign-objective"
                                    checked={selectedObjective === obj.key}
                                    readOnly
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3"
                                />
                                <span className="font-semibold text-gray-800">{obj.title}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="md:w-3/5 bg-gray-50 p-6 rounded-lg border border-gray-200">
                     <div className="min-h-[350px]">
                         {objectiveToDisplay && (
                            <div className="transition-opacity duration-300">
                                <div className="text-blue-500 bg-blue-100 p-3 rounded-full inline-block">
                                    {React.cloneElement(objectiveToDisplay.icon, { className: "w-10 h-10" })}
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mt-4">{objectiveToDisplay.title}</h2>
                                <p className="text-gray-600 mt-2 min-h-[72px]">{objectiveToDisplay.description}</p>
                                <div className="mt-6 border-t pt-4">
                                    <h4 className="font-bold text-sm mb-2 text-gray-700">Bom para:</h4>
                                    <ul className="space-y-2 text-sm">
                                        {objectiveToDisplay.goodFor.map((item, index) => (
                                            <li key={index} className="flex items-start gap-2 text-gray-600">
                                                <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex justify-end space-x-4 pt-6 mt-6 border-t">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">Cancelar</button>
                <button
                    type="button"
                    onClick={handleNext}
                    className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    Continuar <ChevronRight size={18} />
                </button>
            </div>
        </Modal>
    );
};