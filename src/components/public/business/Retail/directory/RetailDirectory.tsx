import React from 'react';
import { useMediaQuery } from '../../../../../hooks/useMediaQuery';
import { RetailDirectory as DesktopDirectory } from './RetailDirectory.desktop';
import { RetailDirectory as MobileDirectory } from './RetailDirectory.mobile';

export const RetailDirectory: React.FC = () => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    
    if (isMobile) {
        return <MobileDirectory />;
    }
    
    return <DesktopDirectory />;
};