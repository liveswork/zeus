import React from 'react';
import { Modal } from '../../ui/Modal';
import { useAuth } from '../../../contexts/AuthContext'; // Para saber o tipo do negócio

// Importe seus formulários especializados
import { RetailProductForm } from '../retail/modules/products/forms/RetailProductForm'; // O que criamos acima
import { FoodProductForm } from '../food/modules/products/forms/FoodProductForm'; // O seu formulário antigo renomeado

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
  onSave: (data: any) => Promise<void>;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ 
  isOpen, onClose, product, onSave 
}) => {
  const { userProfile } = useAuth();
  
  // LÓGICA DE DECISÃO (O Cérebro)
  // Verifica a categoria principal ou subcategoria
  const businessType = userProfile?.businessProfile?.type || 'generic';
  
  // Determina qual formulário renderizar
  const renderForm = () => {
    // Se for Varejo (Roupas, Sapatos, Ótica) -> Usa o RetailForm
    if (['retail', 'fashion', 'otica', 'construction'].includes(businessType)) {
        return (
            <RetailProductForm 
                initialData={product} 
                onSave={onSave} 
                onCancel={onClose} 
                loading={false} 
            />
        );
    }

    // Se for Alimentação (Restaurante, Pizzaria) -> Usa o FoodForm (seu antigo)
    if (['food_service', 'pizzaria', 'restaurant'].includes(businessType)) {
        return (
            <FoodProductForm 
                initialData={product} 
                onSave={onSave} 
                onCancel={onClose} 
                loading={false} 
            />
        );
    }

    // Padrão (Fallback)
    return (
        <div className="p-4 text-center">
            <p>Formulário genérico em construção...</p>
        </div>
    );
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={product ? `Editar Produto (${businessType})` : `Novo Produto (${businessType})`}
      maxWidth="max-w-4xl" // Mais largo para caber a grade
    >
      {renderForm()}
    </Modal>
  );
};