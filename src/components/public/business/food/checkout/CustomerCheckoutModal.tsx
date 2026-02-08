import React from 'react';
import { useMediaQuery } from '../../../../../hooks/useMediaQuery';
import { CustomerCheckoutModal as MobileCheckout } from './CustomerCheckoutModal.mobile';
import { CustomerCheckoutModal as DesktopCheckout } from './CustomerCheckoutModal.desktop';
import { Product } from '../../../../../types';

// Tipos para os props
interface CustomerCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    cart: (Product & { qty: number })[];
    restaurantId: string;
    onOrderFinalized: () => void;
}

export const CustomerCheckoutModal: React.FC<CustomerCheckoutModalProps> = (props) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    
    if (isMobile) {
        return <MobileCheckout {...props} />;
    }
    
    return <DesktopCheckout {...props} />;
};