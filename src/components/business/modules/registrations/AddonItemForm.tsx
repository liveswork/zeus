// src/components/business/modules/registrations/AddonItemForm.tsx
import React, { useRef } from 'react';
import { Trash2, UploadCloud, Loader } from 'lucide-react';
import { FormField } from '../../../ui/FormField';

interface AddonItemFormProps {
  item: any;
  index: number;
  onItemChange: (index: number, field: string, value: any) => void;
  onRemoveItem: (index: number) => void;
  onFileChange: (index: number, file: File) => void;
  isUploading?: boolean;
}

export const AddonItemForm: React.FC<AddonItemFormProps> = ({ 
  item, 
  index, 
  onItemChange, 
  onRemoveItem, 
  onFileChange, 
  isUploading = false 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onItemChange(index, 'imageUrl', '');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(index, e.target.files[0]);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permite valores decimais e trata campos vazios
    const price = value === '' ? 0 : parseFloat(value) || 0;
    onItemChange(index, 'price', price);
  };

  return (
    <div className="grid grid-cols-12 gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Coluna da Imagem */}
      <div className="col-span-3">
        <FormField label="Imagem">
          <div
            onClick={handleImageClick}
            className={`
              relative w-full aspect-square bg-white border-2 border-dashed rounded-lg 
              flex items-center justify-center text-center cursor-pointer transition-colors
              ${isUploading 
                ? 'border-gray-300 cursor-not-allowed opacity-70' 
                : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              disabled={isUploading}
            />
            
            {isUploading ? (
              <div className="flex flex-col items-center text-blue-500">
                <Loader className="animate-spin" size={32} />
                <span className="text-xs mt-2">Enviando...</span>
              </div>
            ) : item.imageUrl ? (
              <>
                <img 
                  src={item.imageUrl} 
                  alt={item.name || 'Item image'} 
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition-colors"
                  title="Remover imagem"
                >
                  <Trash2 size={12} />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <UploadCloud size={24} />
                <span className="text-xs mt-2">Selecionar imagem</span>
                <span className="text-xs text-gray-300 mt-1">JPG, PNG</span>
              </div>
            )}
          </div>
        </FormField>
      </div>

      {/* Coluna de Dados */}
      <div className="col-span-9 space-y-4">
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3">
            <FormField 
              label="Nome do Item" 
              required
              error={!item.name ? 'Nome é obrigatório' : undefined}
            >
              <input
                type="text"
                placeholder="Ex: Bacon, Cheddar, Molho especial"
                value={item.name || ''}
                onChange={(e) => onItemChange(index, 'name', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </FormField>
          </div>
          
          <div className="col-span-2">
            <FormField label="Preço (R$)">
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={item.price === 0 ? '' : item.price}
                  onChange={handlePriceChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {item.price > 0 && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    R$ {item.price.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>
            </FormField>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input
              type="checkbox"
              checked={item.isAvailable ?? true}
              onChange={(e) => onItemChange(index, 'isAvailable', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium">Disponível para venda</span>
          </label>
          
          <button
            type="button"
            onClick={() => onRemoveItem(index)}
            className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
            title="Remover item"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};