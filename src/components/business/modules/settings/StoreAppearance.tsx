import React from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { RetailStoreAppearance } from '../../retail/modules/settings/RetailStoreAppearance';
import { FoodStoreAppearance } from '../../food/modules/settings/FoodStoreAppearance';

export const StoreAppearance: React.FC = () => {
    const { userProfile } = useAuth();

    // Lógica de decisão simples e robusta
    if (userProfile?.businessProfile?.type === 'retail') {
        return <RetailStoreAppearance />;
    }

    // Padrão para food_service ou qualquer outro
    return <FoodStoreAppearance />;
};