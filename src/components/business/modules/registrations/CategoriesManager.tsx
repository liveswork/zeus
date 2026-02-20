// src\components\business\modules\registrations\CategoriesManager.tsx

import React, { useState, useMemo } from 'react';
import {
  PlusCircle,
  Edit,
  Trash2,
  Tag,
  Search,
  Eye,
  EyeOff,
  Hash
} from 'lucide-react';

// Food icons
import {
  Utensils,
  Coffee,
  Pizza,
  IceCream,
  Wine,
  Sandwich,
  Salad,
  Cake,
  Fish,
  Beef,
  Soup,
  Apple,
  Milk,
  Heading as Bread,
  Cookie,
  Cherry,
  Grape,
  Carrot
} from 'lucide-react';

// Retail icons
import {
  Store,
  ShoppingBag,
  Shirt,
  Package,
  Laptop,
  Smartphone,
  Watch,
  Sofa,
  Baby,
  Book,
  Brush,
  Wrench,
  Dumbbell
} from 'lucide-react';

// Subcategory icons
import {
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

import { useBusiness } from '../../../../contexts/BusinessContext';
import { useUI } from '../../../../contexts/UIContext';
import { db } from '../../../../config/firebase';
import { doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { CategoryFormModal } from './CategoryFormModal';
import { SubcategoryFormModal } from './SubcategoryFormModal';

// Mapeamento de ícones para renderização
const iconMap = {
  // Food
  Utensils,
  Coffee,
  Pizza,
  IceCream,
  Wine,
  Sandwich,
  Salad,
  Cake,
  Fish,
  Beef,
  Soup,
  Apple,
  Milk,
  Bread,
  Cookie,
  Cherry,
  Grape,
  Carrot,

  // Retail
  Store,
  ShoppingBag,
  Shirt,
  Package,
  Laptop,
  Smartphone,
  Watch,
  Sofa,
  Baby,
  Book,
  Brush,
  Wrench,
  Dumbbell,

  // Generic
  Tag,
  Hash,

  // Subcategory
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
};

const normalizeType = (t?: any) => (t ? String(t) : 'food');

export const CategoriesManager: React.FC = () => {
  const { categories, subcategories, products, businessId, businessType } = useBusiness() as any;
  const { showAlert, showConfirmation } = useUI();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<any>(null);
  const [currentSubcategory, setCurrentSubcategory] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'categories' | 'subcategories'>('categories');

  const scopedCategories = useMemo(() => {
    return categories.filter((c: any) => normalizeType(c.businessType) === normalizeType(businessType));
  }, [categories, businessType]);

  const scopedSubcategories = useMemo(() => {
    return subcategories.filter((s: any) => normalizeType(s.businessType) === normalizeType(businessType));
  }, [subcategories, businessType]);

  const scopedProducts = useMemo(() => {
    return products.filter((p: any) => normalizeType(p.businessType) === normalizeType(businessType));
  }, [products, businessType]);

  const filteredCategories = useMemo(() => {
    return scopedCategories.filter((category: any) =>
      category.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [scopedCategories, searchTerm]);

  const filteredSubcategories = useMemo(() => {
    return scopedSubcategories.filter((subcategory: any) =>
      subcategory.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [scopedSubcategories, searchTerm]);

  const getCategoryProductCount = (categoryId: string) => {
    return scopedProducts.filter((product: any) => product.categoryId === categoryId).length;
  };

  const getSubcategoryProductCount = (subcategoryId: string) => {
    return scopedProducts.filter((product: any) => product.subcategoryId === subcategoryId).length;
  };

  const getCategoryName = (categoryId: string) => {
    return scopedCategories.find((cat: any) => cat.id === categoryId)?.name || 'Categoria não encontrada';
  };

  const handleOpenCategoryModal = (category: any = null) => {
    setCurrentCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleOpenSubcategoryModal = (subcategory: any = null) => {
    setCurrentSubcategory(subcategory);
    setIsSubcategoryModalOpen(true);
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    const productCount = getCategoryProductCount(categoryId);
    const subcategoryCount = scopedSubcategories.filter((sub: any) => sub.categoryId === categoryId).length;

    if (productCount > 0 || subcategoryCount > 0) {
      showAlert(
        `Não é possível excluir "${categoryName}" pois possui ${productCount} produtos e ${subcategoryCount} subcategorias associadas.`,
        'error'
      );
      return;
    }

    showConfirmation(`Tem certeza que deseja excluir a categoria "${categoryName}"?`, async () => {
      try {
        await deleteDoc(doc(db, 'categories', categoryId));
        showAlert('Categoria excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        showAlert('Erro ao excluir categoria', 'error');
      }
    });
  };

  const handleDeleteSubcategory = (subcategoryId: string, subcategoryName: string) => {
    const productCount = getSubcategoryProductCount(subcategoryId);

    if (productCount > 0) {
      showAlert(
        `Não é possível excluir "${subcategoryName}" pois possui ${productCount} produtos associados.`,
        'error'
      );
      return;
    }

    showConfirmation(`Tem certeza que deseja excluir a subcategoria "${subcategoryName}"?`, async () => {
      try {
        await deleteDoc(doc(db, 'subcategories', subcategoryId));
        showAlert('Subcategoria excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir subcategoria:', error);
        showAlert('Erro ao excluir subcategoria', 'error');
      }
    });
  };

  const toggleCategoryStatus = async (categoryId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'categories', categoryId), {
        isActive: !currentStatus,
        updatedAt: serverTimestamp()
      });
      showAlert(`Categoria ${!currentStatus ? 'ativada' : 'desativada'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      showAlert('Erro ao alterar status da categoria', 'error');
    }
  };

  const toggleSubcategoryStatus = async (subcategoryId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'subcategories', subcategoryId), {
        isActive: !currentStatus,
        updatedAt: serverTimestamp()
      });
      showAlert(`Subcategoria ${!currentStatus ? 'ativada' : 'desativada'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      showAlert('Erro ao alterar status da subcategoria', 'error');
    }
  };

  const renderIcon = (iconName: string, size: number = 18) => {
    const IconComponent = (iconMap as any)[iconName] || Tag;
    return <IconComponent size={size} className="text-gray-600" />;
  };

  const tabs = [
    { id: 'categories' as const, label: 'Categorias', count: scopedCategories.length },
    { id: 'subcategories' as const, label: 'Subcategorias', count: scopedSubcategories.length }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-gray-900">
            Categorias ({normalizeType(businessType) === 'retail' ? 'Varejo' : 'Food'})
          </h1>
          <p className="text-gray-500 mt-2">Organize seus produtos com precisão</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => handleOpenCategoryModal()}
            className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <PlusCircle size={18} />
            <span>Nova Categoria</span>
          </button>
          <button
            onClick={() => handleOpenSubcategoryModal()}
            className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <PlusCircle size={18} />
            <span>Nova Subcategoria</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 p-6">
          <div className="text-2xl font-light text-gray-900">{scopedCategories.length}</div>
          <div className="text-sm text-gray-500 mt-1">Categorias</div>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <div className="text-2xl font-light text-gray-900">{scopedSubcategories.length}</div>
          <div className="text-sm text-gray-500 mt-1">Subcategorias</div>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <div className="text-2xl font-light text-gray-900">
            {scopedCategories.filter((c: any) => c.isActive).length}
          </div>
          <div className="text-sm text-gray-500 mt-1">Ativas</div>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <div className="text-2xl font-light text-gray-900">
            {scopedProducts.filter((p: any) => p.categoryId).length}
          </div>
          <div className="text-sm text-gray-500 mt-1">Produtos Categorizados</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder={`Buscar ${activeTab === 'categories' ? 'categorias' : 'subcategorias'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
        />
      </div>

      {/* Content */}
      {activeTab === 'categories' ? (
        <div className="bg-white border border-gray-200">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-16">
              <Tag size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">
                {searchTerm ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
              </p>
              {!searchTerm && <p className="text-gray-400 text-sm mt-2">Clique em "Nova Categoria" para começar</p>}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Categoria</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Produtos</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Subcategorias</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCategories.map((category: any) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-700 flex items-center justify-center">
                          {renderIcon(category.icon, 18)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{category.name}</div>
                          {category.description && <div className="text-sm text-gray-500">{category.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{getCategoryProductCount(category.id)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {scopedSubcategories.filter((sub: any) => sub.categoryId === category.id).length}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleCategoryStatus(category.id, category.isActive)}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium ${
                          category.isActive ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'
                        }`}
                      >
                        {category.isActive ? (
                          <Eye size={12} className="mr-1" />
                        ) : (
                          <EyeOff size={12} className="mr-1" />
                        )}
                        {category.isActive ? 'Ativa' : 'Inativa'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button onClick={() => handleOpenCategoryModal(category)} className="text-blue-600 hover:text-blue-800 p-1">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeleteCategory(category.id, category.name)} className="text-red-600 hover:text-red-800 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200">
          {filteredSubcategories.length === 0 ? (
            <div className="text-center py-16">
              <Hash size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">
                {searchTerm ? 'Nenhuma subcategoria encontrada' : 'Nenhuma subcategoria cadastrada'}
              </p>
              {!searchTerm && <p className="text-gray-400 text-sm mt-2">Clique em "Nova Subcategoria" para criar subdivisões</p>}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Subcategoria</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Categoria Pai</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Produtos</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubcategories.map((subcategory: any) => {
                  const parentCategory = scopedCategories.find((cat: any) => cat.id === subcategory.categoryId);

                  return (
                    <tr key={subcategory.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-gray-600 flex items-center justify-center">
                            {renderIcon(subcategory.icon, 14)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{subcategory.name}</div>
                            {subcategory.description && <div className="text-sm text-gray-500">{subcategory.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {parentCategory && (
                            <div className="w-5 h-5 bg-gray-700 flex items-center justify-center">
                              {renderIcon(parentCategory.icon, 12)}
                            </div>
                          )}
                          <span className="text-sm text-gray-900">{getCategoryName(subcategory.categoryId)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{getSubcategoryProductCount(subcategory.id)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleSubcategoryStatus(subcategory.id, subcategory.isActive)}
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium ${
                            subcategory.isActive ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'
                          }`}
                        >
                          {subcategory.isActive ? (
                            <Eye size={12} className="mr-1" />
                          ) : (
                            <EyeOff size={12} className="mr-1" />
                          )}
                          {subcategory.isActive ? 'Ativa' : 'Inativa'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button onClick={() => handleOpenSubcategoryModal(subcategory)} className="text-blue-600 hover:text-blue-800 p-1">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteSubcategory(subcategory.id, subcategory.name)} className="text-red-600 hover:text-red-800 p-1">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      {isCategoryModalOpen && (
        <CategoryFormModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          initialData={currentCategory}
        />
      )}

      {isSubcategoryModalOpen && (
        <SubcategoryFormModal
          isOpen={isSubcategoryModalOpen}
          onClose={() => setIsSubcategoryModalOpen(false)}
          initialData={currentSubcategory}
        />
      )}
    </div>
  );
};
