// src/components/business/modules/registrations/AddonsTab.tsx
import React from 'react';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Layers, Box, ShoppingBag, Paperclip } from 'lucide-react';
import { AddonGroup } from '../../../../types';

interface AddonsTabProps {
  selectedGroupIds: string[];
  onToggleGroup: (groupId: string) => void;
}

const getGroupIcon = (type: string) => {
    switch(type) {
        case 'ingredient': return <Box className="text-blue-500" />;
        case 'specification': return <Layers className="text-purple-500" />;
        case 'cross-sell': return <ShoppingBag className="text-green-500" />;
        case 'disposable': return <Paperclip className="text-gray-500" />;
        default: return <Box />;
    }
};

export const AddonsTab: React.FC<AddonsTabProps> = ({ selectedGroupIds, onToggleGroup }) => {
  const { addonGroups } = useBusiness();

  if (addonGroups.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border text-center">
        <Layers size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum Grupo de Complemento Encontrado</h3>
        <p className="text-gray-500">
          Você precisa primeiro criar grupos em <span className="font-semibold">Cadastros {'>'} Complementos</span> para poder vinculá-los aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <h3 className="font-bold text-lg text-gray-800">Vincular Grupos de Complementos</h3>
        <p className="text-sm text-gray-500">Selecione quais grupos de opções aparecerão para o cliente quando ele escolher este produto.</p>
        <div className="space-y-3 pt-4 border-t">
            {addonGroups.map((group: AddonGroup) => (
                <label 
                    key={group.id} 
                    className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <input
                        type="checkbox"
                        checked={selectedGroupIds.includes(group.id)}
                        onChange={() => onToggleGroup(group.id)}
                        className="h-5 w-5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-4 flex items-center gap-3">
                        {getGroupIcon(group.type)}
                        <div>
                            <p className="font-semibold text-gray-900">{group.name}</p>
                            <p className="text-xs text-gray-500">
                                {group.items?.length || 0} itens • {group.isRequired ? 'Obrigatório' : 'Opcional'}
                            </p>
                        </div>
                    </div>
                </label>
            ))}
        </div>
    </div>
  );
};