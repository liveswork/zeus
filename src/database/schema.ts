export const productSchema = {
    title: 'product',
    version: 0, // <--- SUBIMOS A VERSÃO PARA FORÇAR A ATUALIZAÇÃO
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        name: { type: 'string' },
        
        // Descrições
        shortDescription: { type: 'string' }, // <--- Faltava este
        description: { type: 'string' },      // <--- Faltava este

        // Preços e Promoção
        salePrice: { type: 'number' },
        costPrice: { type: 'number' },
        promotionalPrice: { type: 'number' }, // <--- Faltava este
        promoStartDate: { type: 'string' },   // <--- Faltava este
        promoEndDate: { type: 'string' },     // <--- Faltava este

        // Estoque e Identificação
        stockQuantity: { type: 'number' },
        sku: { type: 'string' },
        barcode: { type: 'string' },
        gtin: { type: 'string' }, // EAN
        
        // Imagens
        imageUrl: { type: 'string' },
        imagePath: { type: 'string' },
        gallery: {                        // <--- Faltava a galeria
            type: 'array',
            items: { type: 'string' }
        },

        // Dimensões e Entrega (Faltavam todos estes)
        weight: { type: 'number' },
        length: { type: 'number' },
        width: { type: 'number' },
        height: { type: 'number' },

        // Categorização
        category: { type: 'string' },
        categoryId: { type: 'string' },
        subcategoryId: { type: 'string' },
        
        // Configurações
        active: { type: 'boolean' },
        showInCatalog: { type: 'boolean' },
        allowCombination: { type: 'boolean' },
        productStructure: { type: 'string' },

        // Avançado
        purchaseNote: { type: 'string' }, // <--- Faltava este
        attributes: {                     // <--- Faltava este
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    options: { type: 'string' }
                }
            }
        },

        // Receita (Food Service)
        recipe: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    supplyId: { type: 'string' },
                    quantity: { type: 'number' },
                    unit: { type: 'string' },
                    supplyName: { type: 'string' },
                    additionalProperties: true
                }
            }
        },

        // Variantes (Grade)
        variants: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    productId: { type: 'string' },
                    size: { type: 'string' },
                    color: { type: 'string' },
                    stock: { type: 'number' },
                    barcode: { type: 'string' },
                    salePrice: { type: 'number' },
                    sku: { type: 'string' }, // Adicionado SKU na variante também
                    name: { type: 'string' },
                    additionalProperties: true
                }
            }
        },

        addonGroupIds: {
            type: 'array',
            items: { type: 'string' }
        },

        // Fiscal
        businessId: { type: 'string' },
        ncm: { type: 'string' },
        cest: { type: 'string' },
        origin: { type: 'string' },

        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
    },
    required: [
        'id', 
        'name', 
        'updatedAt'
    ],
    additionalProperties: true 
};

export const customerSchema = {
    title: 'customer',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        name: { type: 'string' },
        phone: { type: 'string', maxLength: 20 },
        email: { type: 'string' },
        address: { type: 'object' },
        cpf: { type: 'string' },
        notes: { type: 'string' },
        updatedAt: { type: 'string', format: 'date-time' }
    },
    required: [
        'id', 
        'name', 
        'phone', 
        'updatedAt'
    ],
    indexes: ['phone'], 
    additionalProperties: true
};

export const userSchema = {
    title: 'user',
    version: 1,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        name: { type: 'string', maxLength: 100 },
        email: { type: 'string', maxLength: 180 },
        pinHash: { type: 'string' },
        role: { type: 'string', maxLength: 100 },
        permissions: { type: 'array', items: { type: 'string' } },
        active: { type: 'boolean', default: true },
        businessId: { type: 'string', maxLength: 100 },
        updatedAt: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' }
    },
    required: [
        "id",
        "email",
        "businessId",
        "role",
        "active",
        "updatedAt",
    ],
    indexes: ['email', 'businessId' ],
    additionalProperties: true
};