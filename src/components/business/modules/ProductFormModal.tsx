import React from 'react';
import { Modal } from '../../ui/Modal';
import { useAuth } from '../../../contexts/AuthContext'; 

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
  
  const businessType = userProfile?.businessProfile?.type || 'generic';
  
  console.log("ProductFormModal - BusinessType:", businessType); // DEBUG
  console.log("ProductFormModal - onSave exists:", !!onSave);   // DEBUG

  const renderForm = () => {
    // Lista de tipos de varejo
    const retailTypes = ['retail', 'fashion', 'otica', 'construction', 'varejo', 'loja_roupas', 'vestuario'];

    if (retailTypes.includes(businessType)) {
        return (
            <RetailProductForm 
                initialData={product} 
                onSave={onSave} 
                onCancel={onClose} 
                loading={false} 
            />
        );
    }

    // Se for Alimentação
    if (['food_service', 'pizzaria', 'restaurant', 'hamburgueria'].includes(businessType)) {
        return (
            <FoodProductForm 
                initialData={product} 
                onSave={onSave} 
                onCancel={onClose} 
                loading={false} 
            />
        );
    }

    // Fallback
    return (
        <div className="p-4 text-center">
            <p>Tipo de negócio não suportado: {businessType}</p>
        </div>
    );
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={product ? `Editar Produto` : `Novo Produto`}
      maxWidth="max-w-6xl" // Ajustado para acomodar o form largo
    >
      {renderForm()}
    </Modal>
  );
};