import {
    Home, BarChart2, Package, TrendingUp, ShoppingCart,
    Clipboard, Truck, Wallet, PlusCircle, XCircle,
    ChevronUp, ChevronDown, FileText, List, Briefcase,
    ShoppingBasket, Settings, Users, Box, DollarSign,
    Zap, Map, ImageIcon,
    BarChart3,
    Puzzle,
    LayoutGrid,
    MapPin,
    Calendar,
    Sparkles,
    RotateCcw,
    Tag
} from 'lucide-react';

// Mapeamento extraído e tipado do seu App.jsx antigo
export const FEATURE_MAP: Record<string, any> = {
    // --- MAIN ---
    'dashboard': { label: 'Dashboard', icon: Home, group: 'main' },
    'bi_dashboard': { label: 'Business Intelligence', icon: BarChart2, group: 'main' },

    // --- VENDAS (FOOD vs RETAIL) ---
    'vendas_pdv': { label: 'Frente de Caixa (PDV)', icon: ShoppingCart, group: 'vendas' }, // Varejo
    'vendas_mesas': { label: 'Gestão de Mesas', icon: Clipboard, group: 'vendas' }, // Restaurante
    'vendas_balcao': { label: 'Venda Rápida', icon: ShoppingCart, group: 'vendas' },
    'vendas_delivery': { label: 'Delivery', icon: Truck, group: 'vendas' },
    'vendas_condicional': { label: 'Venda Condicional', icon: Package , group: 'vendas' },

    'relatorios': { label: 'Relatórios', icon: BarChart3, group: 'main' },

    // --- CAIXA ---
    'caixa_atual': { label: 'Caixa Atual', icon: Wallet, group: 'caixa' },
    'caixa_abertura': { label: 'Abertura', icon: PlusCircle, group: 'caixa', isAction: true },
    'caixa_fechamento': { label: 'Fechamento', icon: XCircle, group: 'caixa', isAction: true },
    'caixa_suprimento': { label: 'Suprimento', icon: ChevronUp , group: 'caixa' },
    'caixa_sangria': { label: 'Sangria', icon: ChevronDown , group: 'caixa' },

    // --- FINANCEIRO ---
    'financeiro_contas_pagar': { label: 'Contas a Pagar', icon: Briefcase, group: 'financeiro' },

    // --- MARKETING & ADS (Recuperado) ---
    'marketing': { label: 'Impulso Marketing', icon: TrendingUp, group: 'marketing' },
    'marketing_journeys': { label: 'Jornadas', icon: Map, group: 'marketing' },
    'cadastros_essencia': { label: 'Essência', icon: Sparkles, group: 'marketing' },
    'marketing_events': { label: 'Eventos', icon: Calendar, group: 'marketing' },

    'loja_extensoes': { label: 'Loja de Extensões', icon: Puzzle, group: 'main' },

    // --- CADASTROS ---
    'cadastros_produtos': { label: 'Produtos', icon: Package, group: 'cadastros' },
    'cadastros_categorias': { label: 'Categorias', icon: Package, group: 'cadastros' },
    'cadastros_produtos_grade': { label: 'Produtos (Grade)', icon: Box, group: 'cadastros' }, // Varejo
    'cadastros_insumos': { label: 'Ingredientes', icon: Package, group: 'cadastros' }, // Restaurante
    'cadastros_clientes': { label: 'Clientes', icon: Users, group: 'cadastros' },
    'configuracoes': { label: 'Configurações', icon: Settings, group: 'sistema' },



    'compras_ver': { label: 'Compras', icon: ShoppingCart, group: 'main' },
    'compras_orcamentos': { label: 'Orçamentos', icon: FileText, group: 'main' },

    'cadastros_fornecedores': { label: 'Fornecedores', icon: Truck, group: 'cadastros' },
   
    'cadastros_mesas': { label: 'Mesas', icon: LayoutGrid, group: 'cadastros' },
    'cadastros_taxas_delivery': { label: 'Taxas Delivery', icon: MapPin, group: 'cadastros' },

    // --- FEATURES DO PAINEL DE FORNECEDOR ---
    'pedidos_fornecedor': { label: 'Pedidos Recebidos', icon: ShoppingBasket, group: 'main_supplier' },
    'catalogo_fornecedor': { label: 'Meu Catálogo', icon: Tag , group: 'main_supplier' },
    'configuracoes_fornecedor': { label: 'Configurações', icon: Settings , group: 'main_supplier' },
    'bi_fornecedor': { label: 'Análise de Vendas', icon: BarChart2 , group: 'main_supplier' },
    
    

    'recuperador_de_vendas': { label: 'Recuperador de Vendas', icon: RotateCcw, group: 'vendas' },
    
};

export const MENU_GROUPS = {
    'main': { label: 'Principal', order: 1 },
    'vendas': { label: 'Vendas', order: 2 },
    'caixa': { label: 'Fluxo de Caixa', order: 3 },
    'marketing': { label: 'Marketing & Ads', order: 4 },
    'financeiro': { label: 'Financeiro', order: 5 },
    'cadastros': { label: 'Cadastros', order: 6 },
    'sistema': { label: 'Sistema', order: 99 }
};