import React from 'react';
import { Modal } from '../../ui/Modal';
import { useAuth } from '../../../contexts/AuthContext';
import { RetailProductForm } from '../retail/modules/products/forms/RetailProductForm';
import { FoodProductForm } from '../food/modules/products/forms/FoodProductForm';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    product?: any;
    onSave?: (data: any) => Promise<void>; // Opcional agora
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
    isOpen, onClose, product, onSave
}) => {
    const { userProfile } = useAuth();
    const businessType = userProfile?.businessProfile?.type || 'retail';

    const renderForm = () => {
        // Key única para forçar reset
        const formKey = `${product ? product.id : 'novo'}`;

        const retailTypes = ['retail', 'fashion', 'otica', 'construction', 'varejo', 'loja_roupas', 'vestuario', 'cosmeticos'];
        const foodTypes = ['food_service', 'pizzaria', 'restaurant', 'hamburgueria', 'sushi'];

        if (retailTypes.includes(businessType) || !foodTypes.includes(businessType)) {
            return (
                <RetailProductForm
                    key={formKey}
                    initialData={product}
                    onSave={onSave || (async () => { })}
                    onCancel={onClose}
                    loading={false}
                />
            );
        }

        if (foodTypes.includes(businessType)) {
            return (
                <FoodProductForm
                    key={formKey}
                    initialData={product}
                    onSave={onSave || (async () => { })} // FoodForm ainda usa modelo antigo, passamos func vazia se não tiver
                    onCancel={onClose}
                    loading={false}
                />
            );
        }

        return <div>Tipo desconhecido</div>;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={product ? `Editar Produto` : `Novo Produto`}
            maxWidth="max-w-6xl"
        >
            {renderForm()}
        </Modal>
    );
};