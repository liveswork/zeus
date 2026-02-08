import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChefHat, ArrowRight, X } from 'lucide-react';
import { useBusiness } from '../../contexts/BusinessContext';

interface ProductRecipeAlertProps {
  onDismiss: () => void;
}

export const ProductRecipeAlert: React.FC<ProductRecipeAlertProps> = ({ onDismiss }) => {
  const { products } = useBusiness();
  
  const productionProducts = products.filter(p => p.productStructure === 'producao');
  const productsWithoutRecipe = productionProducts.filter(p => !p.recipe || p.recipe.length === 0);

  if (productsWithoutRecipe.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <ChefHat size={24} className="text-white" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-orange-600" />
              <h3 className="font-bold text-orange-800">
                Fichas Técnicas Pendentes
              </h3>
            </div>
            
            <p className="text-orange-700 mb-3">
              <strong>{productsWithoutRecipe.length} produtos de produção</strong> estão sem ficha técnica configurada. 
              Isso impede o controle preciso de custos e estoque.
            </p>
            
            <div className="space-y-1 mb-4">
              <p className="text-sm font-medium text-orange-800">Produtos afetados:</p>
              {productsWithoutRecipe.slice(0, 3).map(product => (
                <p key={product.id} className="text-sm text-orange-700">
                  • {product.name}
                </p>
              ))}
              {productsWithoutRecipe.length > 3 && (
                <p className="text-sm text-orange-600">
                  ... e mais {productsWithoutRecipe.length - 3} produtos
                </p>
              )}
            </div>

            <Link
              to="/painel/registrations/products"
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition text-sm font-medium"
              onClick={onDismiss}
            >
              <ChefHat size={16} />
              Configurar Fichas Técnicas
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        
        <button
          onClick={onDismiss}
          className="text-orange-400 hover:text-orange-600 transition"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};