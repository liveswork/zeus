import React from 'react';
import { useMediaQuery } from '../../../../../hooks/useMediaQuery';
import { PublicRetailCatalogPage as DesktopCatalog } from './PublicRetailCatalogPage.desktop';
import { PublicRetailCatalogPage as MobileCatalog } from './PublicRetailCatalogPage.mobile';

export const PublicRetailCatalogPage: React.FC = () => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    
    if (isMobile) {
        return <MobileCatalog />;
    }
    
    return <DesktopCatalog />;
};