import { 
    Home, BarChart2, Package, TrendingUp, ShoppingCart, 
    Clipboard, Truck, Wallet, PlusCircle, XCircle, 
    ChevronUp, ChevronDown, FileText, List, Briefcase, 
    ShoppingBasket, Settings, Users, Box, DollarSign,
    Zap, Map, ImageIcon
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

    // --- CAIXA ---
    'caixa_atual': { label: 'Caixa Atual', icon: Wallet, group: 'caixa' },
    'caixa_abertura': { label: 'Abertura', icon: PlusCircle, group: 'caixa', isAction: true },
    'caixa_fechamento': { label: 'Fechamento', icon: XCircle, group: 'caixa', isAction: true },

    // --- FINANCEIRO ---
    'financeiro_contas_pagar': { label: 'Contas a Pagar', icon: Briefcase, group: 'financeiro' },
    
    // --- MARKETING & ADS (Recuperado) ---
    'marketing': { label: 'Impulso Marketing', icon: TrendingUp, group: 'marketing' },
    'marketing_journeys': { label: 'Jornadas', icon: Map, group: 'marketing' },

    // --- CADASTROS ---
    'cadastros_produtos': { label: 'Produtos', icon: Package, group: 'cadastros' },
    'cadastros_produtos_grade': { label: 'Produtos (Grade)', icon: Box, group: 'cadastros' }, // Varejo
    'cadastros_insumos': { label: 'Ingredientes', icon: Package, group: 'cadastros' }, // Restaurante
    'cadastros_clientes': { label: 'Clientes', icon: Users, group: 'cadastros' },
    'configuracoes': { label: 'Configurações', icon: Settings, group: 'sistema' },
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