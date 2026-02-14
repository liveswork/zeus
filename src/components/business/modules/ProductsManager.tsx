import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';

// Importa os gerenciadores específicos que você separou
import { FoodProductsManager } from '../food/modules/products/FoodProductsManager'; // O seu antigo renomeado
import { RetailProductsManager } from '../retail/modules/products/RetailProductsManager'; // O novo que criei acima

export const ProductsManager: React.FC = () => {
    const { userProfile } = useAuth();
    const businessType = userProfile?.businessProfile?.type || 'generic';

    // Lista de tipos de varejo
    const retailTypes = ['retail', 'fashion', 'otica', 'construction', 'varejo', 'loja_roupas', 'vestuario'];

    // Se for varejo, carrega o painel de grade e estoque
    if (retailTypes.includes(businessType)) {
        return <RetailProductsManager />;
    }

    // Se for comida (ou padrão), carrega o painel de receitas e cardápio
    return <FoodProductsManager />;
};