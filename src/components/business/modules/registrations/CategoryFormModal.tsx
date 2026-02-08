import React, { useState, useEffect } from 'react';
import { Tag, Save, Coffee, Utensils, Pizza, IceCream, Wine, Sandwich, Salad, Cake, Fish, Beef, Soup, Apple, Milk, Heading as Bread, Cookie, Cherry, Grape, Carrot } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Modal } from '../../../ui/Modal';
import { FormField } from '../../../ui/FormField';
import { useUI } from '../../../../contexts/UIContext';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

const iconOptions = [
  { name: 'Utensils', icon: Utensils, label: 'Pratos Principais' },
  { name: 'Coffee', icon: Coffee, label: 'Bebidas Quentes' },
  { name: 'Wine', icon: Wine, label: 'Bebidas Alcoólicas' },
  { name: 'Pizza', icon: Pizza, label: 'Pizzas' },
  { name: 'IceCream', icon: IceCream, label: 'Sobremesas' },
  { name: 'Sandwich', icon: Sandwich, label: 'Lanches' },
  { name: 'Salad', icon: Salad, label: 'Saladas' },
  { name: 'Cake', icon: Cake, label: 'Bolos' },
  { name: 'Fish', icon: Fish, label: 'Peixes' },
  { name: 'Beef', icon: Beef, label: 'Carnes' },
  { name: 'Soup', icon: Soup, label: 'Sopas' },
  { name: 'Apple', icon: Apple, label: 'Frutas' },
  { name: 'Milk', icon: Milk, label: 'Laticínios' },
  { name: 'Bread', icon: Bread, label: 'Pães' },
  { name: 'Cookie', icon: Cookie, label: 'Doces' },
  { name: 'Cherry', icon: Cherry, label: 'Frutas Vermelhas' },
  { name: 'Grape', icon: Grape, label: 'Uvas' },
  { name: 'Carrot', icon: Carrot, label: 'Vegetais' },
  { name: 'Tag', icon: Tag, label: 'Outros' }
];

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  initialData
}) => {
  const { showAlert } = useUI();
  const { businessId, categories } = useBusiness();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Utensils',
    isActive: true
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          icon: initialData.icon || 'Utensils',
          isActive: initialData.isActive !== undefined ? initialData.isActive : true
        });
      } else {
        setFormData({
          name: '',
          description: '',
          icon: 'Utensils',
          isActive: true
        });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleIconSelect = (iconName: string) => {
    setFormData(prev => ({ ...prev, icon: iconName }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showAlert('Nome da categoria é obrigatório', 'error');
      return;
    }

    const existingCategory = categories.find(cat => 
      cat.name.toLowerCase() === formData.name.toLowerCase() && 
      cat.id !== initialData?.id
    );

    if (existingCategory) {
      showAlert('Já existe uma categoria com este nome', 'error');
      return;
    }

    setLoading(true);
    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon: formData.icon,
        color: '#6B7280', // Cor padrão elegante
        isActive: formData.isActive,
        businessId,
        sortOrder: initialData?.sortOrder || categories.length,
        ...(initialData ? { updatedAt: serverTimestamp() } : { createdAt: serverTimestamp() })
      };

      if (initialData) {
        const categoryRef = doc(db, 'categories', initialData.id);
        await updateDoc(categoryRef, categoryData);
        showAlert('Categoria atualizada com sucesso!');
      } else {
        await addDoc(collection(db, 'categories'), categoryData);
        showAlert('Categoria criada com sucesso!');
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      showAlert('Erro ao salvar categoria', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedIconData = iconOptions.find(opt => opt.name === formData.icon);
  const SelectedIcon = selectedIconData?.icon || Tag;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData ? 'Editar Categoria' : 'Nova Categoria'} 
      size="4xl"
    >
      <div className="grid grid-cols-2 gap-16 h-96">
        {/* Coluna Esquerda - Formulário */}
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Informações da Categoria</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField label="Nome da Categoria">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  placeholder="Ex: Bebidas, Pratos Principais, Sobremesas"
                  required
                />
              </FormField>

              <FormField label="Descrição">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors resize-none"
                  placeholder="Descreva esta categoria..."
                />
              </FormField>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">
                  Categoria ativa
                </label>
              </div>
            </form>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Salvando...' : (initialData ? 'Atualizar' : 'Criar')}
            </button>
          </div>
        </div>

        {/* Coluna Direita - Seletor de Ícones */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Escolha o Ícone</h3>
            
            {/* Preview do ícone selecionado */}
            <div className="text-center mb-8 p-6 bg-gray-50 border border-gray-200">
              <div className="w-16 h-16 mx-auto mb-3 bg-gray-700 flex items-center justify-center">
                <SelectedIcon size={28} className="text-white" />
              </div>
              <p className="text-sm font-medium text-gray-700">{selectedIconData?.label}</p>
            </div>
            
            {/* Grid de ícones - 6 colunas x 4 linhas = 24 ícones sem scroll */}
            <div className="grid grid-cols-6 gap-2">
              {iconOptions.slice(0, 18).map(option => {
                const IconComponent = option.icon;
                const isSelected = formData.icon === option.name;
                
                return (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() => handleIconSelect(option.name)}
                    className={`aspect-square p-3 border transition-all duration-200 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    title={option.label}
                  >
                    <IconComponent size={18} className={isSelected ? 'text-blue-600' : 'text-gray-600'} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};