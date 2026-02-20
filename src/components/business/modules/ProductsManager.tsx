import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { RetailProductsManager } from '../retail/modules/products/RetailProductsManager';
import { FoodProductsManager } from '../food/modules/products/FoodProductsManager';

export const ProductsManager: React.FC = () => {
    const { userProfile } = useAuth();
    
    // Obtém o tipo do negócio
    const businessType = userProfile?.businessProfile?.type || 'generic';
    
    // Lista de tipos de varejo (adicionei variações comuns)
    const retailTypes = [
        'retail', 'varejo', 'fashion', 'moda', 'clothing', 
        'store', 'loja', 'otica', 'construction', 'cosmeticos',
        'eletronicos', 'fitness', 'fab_fitness' // Adicione variações específicas se houver
    ];

    // DEBUG: Veja no console do navegador o que está sendo impresso
    console.log("ProductsManager: Tipo de Negócio Detectado:", businessType);
    console.log("É Retail?", retailTypes.includes(businessType));

    // Verifica se o tipo do negócio está na lista de Retail
    if (retailTypes.includes(businessType)) {
        return <RetailProductsManager />;
    }

    // Se não for Retail, assume Food (padrão)
    return <FoodProductsManager />;
};