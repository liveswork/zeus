// src/components/public/catalog/PublicCatalogPage.tsx

import React from 'react';
import { useMediaQuery } from '../../../../../hooks/useMediaQuery';
import { PublicCatalogPage as DesktopCatalog } from './PublicCatalogPage.desktop';
import { PublicCatalogPage as MobileCatalog } from './PublicCatalogPage.mobile';

export const PublicCatalogPage: React.FC = () => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    
    if (isMobile) {
        return <MobileCatalog />;
    }
    
    return <DesktopCatalog />;
};