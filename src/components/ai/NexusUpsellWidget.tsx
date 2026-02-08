import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface NexusUpsellWidgetProps {
    cart: any[];
    customerData: any;
    products: any[];
    onUpsellSelect: (product: any, quantity: number) => void;
}

export const NexusUpsellWidget: React.FC<NexusUpsellWidgetProps> = ({
    cart = [],
    customerData,
    products = [],
    onUpsellSelect
}) => {

    const upsellSuggestion = useMemo(() => {
        // Verificar se os dados necessários estão disponíveis
        if (!cart || cart.length === 0 || !products || products.length === 0) {
            return null;
        }

        // 1. Encontrar candidatos para upsell (ex: bebidas e sobremesas que não estão no carrinho)
        const cartIds = new Set(cart.map(item => item.id));
        const candidates = products.filter(p =>
            p && 
            !cartIds.has(p.id) &&
            (p.category === 'Bebidas' || p.category === 'Sobremesas') &&
            p.costPrice > 0 // Apenas produtos com custo definido
        );

        if (candidates.length === 0) return null;

        // 2. Analisar e encontrar o melhor candidato (maior margem de lucro)
        let bestCandidate: any = null;
        let maxMargin = -1;

        candidates.forEach(p => {
            if (p && p.salePrice && p.costPrice) {
                const margin = (p.salePrice - p.costPrice);
                if (margin > maxMargin) {
                    maxMargin = margin;
                    bestCandidate = p;
                }
            }
        });

        if (!bestCandidate) return null;

        // 3. Criar a oferta e a copy
        const originalTotal = cart.reduce((sum, item) => {
            if (item && item.salePrice && item.qty) {
                return sum + item.salePrice * item.qty;
            }
            return sum;
        }, 0);
        
        const originalCombinedPrice = originalTotal + bestCandidate.salePrice;
        // Oferecer um pequeno desconto para incentivar
        const offerPrice = Math.ceil(originalCombinedPrice * 0.95);
        const discount = originalCombinedPrice - offerPrice;

        // Criar a copy personalizada
        const customerFirstName = customerData?.displayName?.split(' ')[0] || 'Cliente';
        let copy = `Olá ${customerFirstName}! `;
        
        if (customerData && (customerData.orderCount || 0) >= 5) {
            copy += `Vimos que você é um cliente fiel (${customerData.orderCount + 1}ª compra!). `;
        }
        
        copy += `Que tal adicionar um(a) ${bestCandidate.name} e fechar o pedido por apenas ${formatCurrency(offerPrice)}?`;

        return {
            product: bestCandidate,
            copy,
            offerPrice,
            discount,
        };

    }, [cart, customerData, products]);

    // Se não há sugestão, não renderiza nada
    if (!upsellSuggestion) {
        return null;
    }

    const handleAccept = () => {
        if (upsellSuggestion?.product) {
            onUpsellSelect(upsellSuggestion.product, 1);
        }
    };

    return (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles size={16} className="text-white" />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-purple-800">Sugestão da IA</h4>
                    <p className="text-sm text-purple-700 mt-1">{upsellSuggestion.copy}</p>
                    <div className="mt-3 flex items-center gap-4 flex-wrap">
                        <button
                            onClick={handleAccept}
                            className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Adicionar ao Pedido
                        </button>
                        <p className="text-xs text-green-600 font-semibold">
                            Economia de {formatCurrency(upsellSuggestion.discount)}!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};