import React, { useState } from 'react';
import { Palette, Settings, Printer, Eye, BrainCircuit } from 'lucide-react';

// Por agora, vamos simular os blocos que o utilizador pode arrastar.
// No futuro, isto virá do seu banco de dados.
const PALETTE_BLOCKS = [
    { id: 'massa', type: 'massa', title: 'Escolha sua Massa' },
    { id: 'molho', type: 'molho', title: 'Selecione o Molho' },
    { id: 'ingredientes_gratis', type: 'ingredientes', title: 'Ingredientes (Até 3 grátis)', limit: 3, itemPrice: 0 },
    { id: 'ingredientes_pagos', type: 'ingredientes', title: 'Turbine seu Prato (Pagos)', limit: 0, itemPrice: 3.50 },
];

// O componente principal do nosso estúdio de criação
export const CreatorStudio: React.FC = () => {
    const [comandaLayout, setComandaLayout] = useState<any[]>([]);
    const [selectedBlock, setSelectedBlock] = useState<any | null>(null);

    const handleDrop = (blockType: string) => {
        const blockData = PALETTE_BLOCKS.find(b => b.type === blockType);
        if (blockData) {
            // Adiciona um ID único para cada bloco adicionado
            setComandaLayout(prev => [...prev, { ...blockData, instanceId: Date.now() }]);
        }
    };

    const handleSelectBlock = (instanceId: number) => {
        const block = comandaLayout.find(b => b.instanceId === instanceId);
        setSelectedBlock(block || null);
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Coluna Esquerda: Paleta de Blocos */}
            <aside className="w-64 bg-white p-4 border-r border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                    <Palette size={20} className="mr-2" />
                    Blocos de Conteúdo
                </h2>
                <div className="mt-4 space-y-3">
                    {PALETTE_BLOCKS.map(block => (
                        <div
                            key={block.id}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData("blockType", block.type)}
                            className="p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-grab active:cursor-grabbing"
                        >
                            <p className="font-semibold">{block.title}</p>
                            <p className="text-xs text-gray-500">Tipo: {block.type}</p>
                        </div>
                    ))}
                </div>
                 {/* Sugestão da IA Maestro */}
                 <div className="mt-8 p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <h3 className="font-bold text-purple-800 flex items-center">
                        <BrainCircuit size={18} className="mr-2"/>
                        Nexus Maestro AI™
                    </h3>
                    <p className="text-xs text-purple-700 mt-1">
                        Sugestão: Adicionar um bloco de "Bebidas" aumenta o ticket médio em 15%.
                    </p>
                </div>
            </aside>

            {/* Centro: A Tela de Desenho (Canvas) */}
            <main
                className="flex-1 p-8"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    const blockType = e.dataTransfer.getData("blockType");
                    handleDrop(blockType);
                }}
            >
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Creator Studio: Comanda de Massas</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg flex items-center gap-2"><Eye size={16}/> Pré-visualizar</button>
                        <button className="px-4 py-2 bg-orange-500 text-white font-bold rounded-lg flex items-center gap-2"><Printer size={16}/> Salvar e Imprimir</button>
                    </div>
                </div>
                <div className="w-full h-[80vh] bg-white rounded-xl shadow-lg p-8 border border-gray-200 overflow-y-auto">
                    <h2 className="text-center text-2xl font-bold mb-6">Monte Sua Massa</h2>
                    {comandaLayout.length > 0 ? (
                        <div className="space-y-6">
                            {comandaLayout.map(block => (
                                <div
                                    key={block.instanceId}
                                    onClick={() => handleSelectBlock(block.instanceId)}
                                    className={`p-4 border-2 rounded-lg cursor-pointer ${selectedBlock?.instanceId === block.instanceId ? 'border-orange-500' : 'border-dashed border-gray-300'}`}
                                >
                                    <h3 className="font-bold text-lg">{block.title}</h3>
                                    <p className="text-sm text-gray-500">Clique para editar as propriedades deste bloco &rarr;</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="flex items-center justify-center h-full text-center text-gray-400">
                            <p>Arraste os blocos da esquerda para começar a montar sua comanda aqui.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Coluna Direita: Painel de Propriedades */}
            <aside className="w-72 bg-white p-4 border-l border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                    <Settings size={20} className="mr-2" />
                    Propriedades
                </h2>
                {selectedBlock ? (
                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="text-sm font-semibold">Título do Bloco</label>
                            <input type="text" value={selectedBlock.title} className="w-full p-2 border border-gray-300 rounded-lg mt-1" />
                        </div>
                         {selectedBlock.type === 'ingredientes' && (
                             <div>
                                <label className="text-sm font-semibold">Limite de Itens Grátis</label>
                                <input type="number" value={selectedBlock.limit} className="w-full p-2 border border-gray-300 rounded-lg mt-1" />
                            </div>
                         )}
                         <button className="w-full py-2 bg-red-500 text-white rounded-lg">Remover Bloco</button>
                    </div>
                ) : (
                    <div className="mt-4 text-center text-sm text-gray-500">
                        <p>Selecione um bloco na comanda para ver suas propriedades.</p>
                    </div>
                )}
            </aside>
        </div>
    );
};