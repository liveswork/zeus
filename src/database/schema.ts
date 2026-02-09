export const productSchema = {
    title: 'product',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        name: { type: 'string' },
        salePrice: { type: 'number' },
        costPrice: { type: 'number' },
        stockQuantity: { type: 'number' },

        // Campos que adicionamos antes
        category: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },

        categoryId: { type: 'string' },
        subcategoryId: { type: 'string' },
        productStructure: { type: 'string' },
        imageUrl: { type: 'string' },
        imagePath: { type: 'string' },
        sku: { type: 'string' },
        barcode: { type: 'string' },
        active: { type: 'boolean' },
        showInCatalog: { type: 'boolean' },
        allowCombination: { type: 'boolean' },

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

        // 🟢 NOVO: Suporte para Variantes (Tamanhos, Cores, etc.)
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
                    additionalProperties: true

                }
            }
        },

        addonGroupIds: {
            type: 'array',
            items: { type: 'string' }
        },

        // Campos extras de negócio (para evitar erros futuros se eles vierem null/undefined)
        businessId: { type: 'string' },
        ncm: { type: 'string' },
        cest: { type: 'string' },
        gtin: { type: 'string' },
        origin: { type: 'string' },

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
    indexes: ['phone'], // Busca rápida
    additionalProperties: true
};

export const userSchema = {
    title: 'user',
    version: 1,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },

        // Identidade
        name: {
            type: 'string',
            maxLength: 100
        },

        email: {
            type: 'string',
            maxLength: 180
        },

        // Autenticação LOCAL
        pinHash: { type: 'string' },

        // Autorização
        role: {
            type: 'string',
            maxLength: 100
        },

        permissions: {
            type: 'array',
            items: { type: 'string' }
        },

        // Controle de sessão
        active: {
            type: 'boolean',
            default: true
        },

        // Multi-tenant / futuro marketplace
        businessId: {
            type: 'string',
            maxLength: 100

        },

        // Sincronização
        updatedAt: {
            type: 'string',
            format: 'date-time'
        },

        createdAt: {
            type: 'string',
            format: 'date-time'
        }
    },

    required: [
        "id",
        "email",
        "businessId",
      //  "name",
      //  "pinHash",
        "role",
        "active",
        "updatedAt",

    ],

    indexes: ['email', 'businessId' ],
    additionalProperties: true
};