import React from 'react';
import { useMediaQuery } from '../../../../../hooks/useMediaQuery';
import { RestaurantDirectory as DesktopDirectory } from './RestaurantDirectory.desktop';
import { RestaurantDirectory as MobileDirectory } from './RestaurantDirectory.mobile';

export const RestaurantDirectory: React.FC = () => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    
    if (isMobile) {
        return <MobileDirectory />;
    }
    
    return <DesktopDirectory />;
};