import React from 'react';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { SupplierDirectory as DesktopDirectory } from './SupplierDirectory.desktop';
import { SupplierDirectory as MobileDirectory } from './SupplierDirectory.mobile';

export const SupplierDirectory: React.FC = () => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    
    if (isMobile) {
        return <MobileDirectory />;
    }
    
    return <DesktopDirectory />;
};