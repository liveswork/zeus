import React from 'react';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { PublicSupplierCatalogPage as DesktopCatalog } from './PublicSupplierCatalogPage.desktop';
import { PublicSupplierCatalogPage as MobileCatalog } from './PublicSupplierCatalogPage.mobile';

export const PublicSupplierCatalogPage: React.FC = () => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    
    if (isMobile) {
        return <MobileCatalog />;
    }
    
    return <DesktopCatalog />;
};