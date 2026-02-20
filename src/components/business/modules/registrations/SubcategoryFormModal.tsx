// src\components\business\modules\registrations\SubcategoryFormModal.tsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  Hash,
  Star,
  Zap,
  Heart,
  Crown,
  Shield,
  Flame,
  Snowflake,
  Sun,
  Moon,
  Clock,
  Gift,
  Award,
  Target,
  Compass,
  Anchor,
  Feather,
  Gem
} from 'lucide-react';

import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Modal } from '../../../ui/Modal';
import { FormField } from '../../../ui/FormField';
import { useUI } from '../../../../contexts/UIContext';

interface SubcategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

const normalizeType = (t?: any) => (t ? String(t) : 'food');

const subcategoryIconOptions = [
  { name: 'Star', icon: Star, label: 'Destaque' },
  { name: 'Zap', icon: Zap, label: 'Rápido' },
  { name: 'Heart', icon: Heart, label: 'Favoritos' },
  { name: 'Crown', icon: Crown, label: 'Premium' },
  { name: 'Shield', icon: Shield, label: 'Saudável' },
  { name: 'Flame', icon: Flame, label: 'Picante' },
  { name: 'Snowflake', icon: Snowflake, label: 'Gelado' },
  { name: 'Sun', icon: Sun, label: 'Quente' },
  { name: 'Moon', icon: Moon, label: 'Noturno' },
  { name: 'Clock', icon: Clock, label: 'Rápido' },
  { name: 'Gift', icon: Gift, label: 'Promoção' },
  { name: 'Award', icon: Award, label: 'Premiado' },
  { name: 'Target', icon: Target, label: 'Especial' },
  { name: 'Compass', icon: Compass, label: 'Regional' },
  { name: 'Anchor', icon: Anchor, label: 'Tradicional' },
  { name: 'Feather', icon: Feather, label: 'Leve' },
  { name: 'Gem', icon: Gem, label: 'Exclusivo' },
  { name: 'Hash', icon: Hash, label: 'Padrão' }
];

export const SubcategoryFormModal: React.FC<SubcategoryFormModalProps> = ({ isOpen, onClose, initialData }) => {
  const { showAlert } = useUI();
  const { businessId, categories, subcategories, businessType } = useBusiness() as any;
  const [loading, setLoading] = useState(false);

  const activeCategories = useMemo(() => {
    return categories
      .filter((cat: any) => cat.isActive)
      .filter((cat: any) => normalizeType(cat.businessType) === normalizeType(businessType));
  }, [categories, businessType]);

  const scopedSubcategories = useMemo(() => {
    return subcategories.filter((s: any) => normalizeType(s.businessType) === normalizeType(businessType));
  }, [subcategories, businessType]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    icon: 'Hash',
    isActive: true
  });

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        categoryId: initialData.categoryId || '',
        icon: initialData.icon || 'Hash',
        isActive: initialData.isActive !== undefined ? initialData.isActive : true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        categoryId: activeCategories.length > 0 ? activeCategories[0].id : '',
        icon: 'Hash',
        isActive: true
      });
    }
  }, [isOpen, initialData, activeCategories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      showAlert('Nome da subcategoria é obrigatório', 'error');
      return;
    }

    if (!formData.categoryId) {
      showAlert('Selecione uma categoria pai', 'error');
      return;
    }

    const existingSubcategory = scopedSubcategories.find((sub: any) =>
      sub.name?.toLowerCase() === formData.name.toLowerCase() &&
      sub.categoryId === formData.categoryId &&
      sub.id !== initialData?.id
    );

    if (existingSubcategory) {
      showAlert('Já existe uma subcategoria com este nome nesta categoria', 'error');
      return;
    }

    setLoading(true);
    try {
      const subcategoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        icon: formData.icon,
        color: '#6B7280',
        isActive: formData.isActive,
        businessId,
        businessType: businessType || 'food', // ✅ separa Food x Retail
        sortOrder:
          initialData?.sortOrder ||
          scopedSubcategories.filter((s: any) => s.categoryId === formData.categoryId).length,
        ...(initialData ? { updatedAt: serverTimestamp() } : { createdAt: serverTimestamp() })
      };

      if (initialData) {
        const subcategoryRef = doc(db, 'subcategories', initialData.id);
        await updateDoc(subcategoryRef, subcategoryData);
        showAlert('Subcategoria atualizada com sucesso!');
      } else {
        await addDoc(collection(db, 'subcategories'), subcategoryData);
        showAlert('Subcategoria criada com sucesso!');
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar subcategoria:', error);
      showAlert('Erro ao salvar subcategoria', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedIconData = subcategoryIconOptions.find(opt => opt.name === formData.icon);
  const SelectedIcon = selectedIconData?.icon || Hash;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Editar Subcategoria' : 'Nova Subcategoria'} size="4xl">
      <div className="grid grid-cols-2 gap-16 h-96">
        {/* Coluna Esquerda */}
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Informações da Subcategoria</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField label="Nome da Subcategoria">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  placeholder={normalizeType(businessType) === 'retail' ? 'Ex: Camisas, Calçados, Acessórios' : 'Ex: Refrigerantes, Massas, Tortas'}
                  required
                />
              </FormField>

              <FormField label="Categoria Pai">
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {activeCategories.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Descrição">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors resize-none"
                  placeholder="Descreva esta subcategoria..."
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
                <label className="text-sm text-gray-700">Subcategoria ativa</label>
              </div>
            </form>
          </div>

          {/* Ações */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button type="button" onClick={onClose} disabled={loading} className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400">
              {loading ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </div>

        {/* Coluna Direita */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Escolha o Ícone</h3>

            <div className="text-center mb-8 p-6 bg-gray-50 border border-gray-200">
              <div className="w-16 h-16 mx-auto mb-3 bg-gray-700 flex items-center justify-center">
                <SelectedIcon size={28} className="text-white" />
              </div>
              <p className="text-sm font-medium text-gray-700">{selectedIconData?.label}</p>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {subcategoryIconOptions.map(option => {
                const IconComponent = option.icon;
                const isSelected = formData.icon === option.name;

                return (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() => handleIconSelect(option.name)}
                    className={`aspect-square p-3 border transition-all duration-200 ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    title={option.label}
                  >
                    <IconComponent size={16} className={isSelected ? 'text-blue-600' : 'text-gray-600'} />
                  </button>
                );
              })}
            </div>

            {activeCategories.length === 0 && (
              <p className="text-xs text-red-500 mt-3">
                Nenhuma categoria ativa encontrada para {normalizeType(businessType) === 'retail' ? 'Varejo' : 'Food'}. Crie uma categoria primeiro.
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
