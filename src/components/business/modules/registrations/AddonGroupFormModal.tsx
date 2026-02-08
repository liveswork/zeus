// src/components/business/modules/registrations/AddonGroupFormModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../../../ui/Modal';
import { FormField } from '../../../ui/FormField';
import { PlusCircle, Save, Info } from 'lucide-react';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { useUI } from '../../../../contexts/UIContext';
import { db, storage } from '../../../../config/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { AddonItemForm } from './AddonItemForm';
import imageCompression from 'browser-image-compression';

interface AddonGroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

interface UploadQueueItem {
  index: number;
  file: File;
}

export const AddonGroupFormModal: React.FC<AddonGroupFormModalProps> = ({ 
  isOpen, 
  onClose, 
  initialData 
}) => {
  const { businessId } = useBusiness();
  const { showAlert } = useUI();
  const [loading, setLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [index: number]: boolean }>({});

  const getInitialState = () => ({
    name: '',
    type: 'ingredient',
    isRequired: false,
    minSelection: 0,
    maxSelection: 1,
    items: [],
    ...initialData,
  });

  const [formData, setFormData] = useState(getInitialState());

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialState());
      setUploadQueue([]);
      setUploadProgress({});
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const isNumeric = type === 'number';

    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox 
        ? (e.target as HTMLInputElement).checked 
        : isNumeric 
          ? parseInt(value, 10) || 0 
          : value
    }));
  };

  const onItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const onAddItem = () => {
    const newItem = { 
      id: `temp_${Date.now()}`, 
      name: '', 
      price: 0, 
      isAvailable: true, 
      imageUrl: '', 
      imagePath: '' 
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const onRemoveItem = async (index: number) => {
    const item = formData.items[index];
    
    // Remove imagem do storage se existir
    if (item.imagePath) {
      try {
        const imageRef = ref(storage, item.imagePath);
        await deleteObject(imageRef);
      } catch (error) {
        console.warn('Erro ao remover imagem do storage:', error);
      }
    }

    // Remove da fila de upload
    setUploadQueue(prev => prev.filter(item => item.index !== index));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });

    // Remove o item
    setFormData(prev => ({ 
      ...prev, 
      items: prev.items.filter((_, i) => i !== index) 
    }));
  };

  const handleFileChange = async (index: number, file: File) => {
    if (!file) return;

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: 'image/webp'
    };

    try {
      setUploadProgress(prev => ({ ...prev, [index]: true }));
      
      const compressedFile = await imageCompression(file, options);
      
      // Adiciona à fila de upload
      setUploadQueue(prev => [...prev.filter(item => item.index !== index), { index, file: compressedFile }]);
      
      // Preview imediato
      const previewUrl = URL.createObjectURL(compressedFile);
      onItemChange(index, 'imageUrl', previewUrl);
      
    } catch (error) {
      console.error('Erro na compressão:', error);
      showAlert('Erro ao processar a imagem.', 'error');
    } finally {
      setUploadProgress(prev => ({ ...prev, [index]: false }));
    }
  };

  const uploadImage = async (index: number, file: File): Promise<{ imageUrl: string; imagePath: string }> => {
    const filePath = `addon_items/${businessId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return { imageUrl: downloadURL, imagePath: filePath };
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      showAlert('Nome do grupo é obrigatório', 'error');
      return false;
    }

    if (formData.items.length === 0) {
      showAlert('Adicione pelo menos um item ao grupo', 'error');
      return false;
    }

    // Valida itens sem nome
    const invalidItems = formData.items.filter(item => !item.name.trim());
    if (invalidItems.length > 0) {
      showAlert('Todos os itens devem ter um nome', 'error');
      return false;
    }

    // Valida regras de seleção
    if (formData.minSelection > formData.maxSelection) {
      showAlert('Quantidade mínima não pode ser maior que a máxima', 'error');
      return false;
    }

    if (formData.maxSelection > formData.items.length) {
      showAlert('Quantidade máxima não pode ser maior que o número de itens', 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      // Upload das imagens na fila
      const uploadPromises = uploadQueue.map(async ({ index, file }) => {
        const { imageUrl, imagePath } = await uploadImage(index, file);
        return { index, imageUrl, imagePath };
      });

      const uploadResults = await Promise.all(uploadPromises);

      // Atualiza os itens com as URLs das imagens
      const updatedItems = formData.items.map((item, index) => {
        const uploadResult = uploadResults.find(result => result.index === index);
        if (uploadResult) {
          return { 
            ...item, 
            imageUrl: uploadResult.imageUrl, 
            imagePath: uploadResult.imagePath 
          };
        }
        return item;
      });

      const dataToSave = {
        name: formData.name.trim(),
        type: formData.type,
        isRequired: formData.isRequired,
        minSelection: formData.isRequired ? Math.max(1, formData.minSelection) : 0,
        maxSelection: Math.max(formData.minSelection, formData.maxSelection),
        items: updatedItems,
        businessId,
        updatedAt: serverTimestamp(),
      };

      if (initialData?.id) {
        await updateDoc(doc(db, 'addonGroups', initialData.id), dataToSave);
        showAlert('Grupo atualizado com sucesso!', 'success');
      } else {
        await addDoc(collection(db, 'addonGroups'), { 
          ...dataToSave, 
          createdAt: serverTimestamp() 
        });
        showAlert('Grupo criado com sucesso!', 'success');
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showAlert('Erro ao salvar o grupo de complementos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getTypeDescription = (type: string) => {
    const descriptions = {
      'ingredient': 'Ingredientes que podem ser adicionados ou removidos do produto',
      'specification': 'Opções de escolha única ou múltipla para personalização',
      'cross-sell': 'Sugestões de produtos adicionais para aumentar o ticket',
      'disposable': 'Itens descartáveis como talheres, guardanapos, etc.'
    };
    return descriptions[type as keyof typeof descriptions] || '';
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData ? 'Editar Grupo' : 'Novo Grupo de Complementos'} 
      size="5xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seção 1: Detalhes do Grupo */}
        <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
          <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
            Detalhes do Grupo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label="Nome do Grupo" 
              required
              error={!formData.name.trim() ? 'Nome é obrigatório' : undefined}
            >
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Adicionais, Molhos, Acompanhamentos"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </FormField>
            
            <FormField 
              label="Tipo do Grupo"
              description={getTypeDescription(formData.type)}
            >
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ingredient">Ingredientes (Adicionar/Remover)</option>
                <option value="specification">Especificações (Escolha Única/Múltipla)</option>
                <option value="cross-sell">Sugestão (Aproveite e leve...)</option>
                <option value="disposable">Descartáveis</option>
              </select>
            </FormField>
          </div>
        </div>

        {/* Seção 2: Regras de Seleção */}
        <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
          <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
            Regras de Seleção
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField 
              label="Obrigatório?"
              description="Usuário deve selecionar pelo menos um item"
            >
              <div className="flex items-center h-12">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isRequired"
                    checked={formData.isRequired}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 font-medium">Sim, obrigatório</span>
                </label>
              </div>
            </FormField>
            
            <FormField 
              label="Quantidade Mínima"
              description="Mínimo de itens que podem ser selecionados"
            >
              <input
                name="minSelection"
                type="number"
                min="0"
                max={formData.items.length}
                value={formData.minSelection}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
            
            <FormField 
              label="Quantidade Máxima"
              description="Máximo de itens que podem ser selecionados"
            >
              <input
                name="maxSelection"
                type="number"
                min={formData.minSelection}
                max={formData.items.length}
                value={formData.maxSelection}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
          </div>
          
          {formData.minSelection > formData.maxSelection && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <Info size={16} />
              <span className="text-sm">A quantidade mínima não pode ser maior que a máxima</span>
            </div>
          )}
        </div>

        {/* Seção 3: Itens do Grupo */}
        <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
              Itens do Grupo
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({formData.items.length} {formData.items.length === 1 ? 'item' : 'itens'})
              </span>
            </h3>
            <button
              type="button"
              onClick={onAddItem}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <PlusCircle size={18} />
              Adicionar Item
            </button>
          </div>

          {formData.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <PlusCircle size={32} className="mx-auto mb-2 text-gray-400" />
              <p>Nenhum item adicionado</p>
              <p className="text-sm">Clique em "Adicionar Item" para começar</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {formData.items.map((item, index) => (
                <AddonItemForm
                  key={item.id || index}
                  item={item}
                  index={index}
                  onItemChange={onItemChange}
                  onRemoveItem={onRemoveItem}
                  onFileChange={handleFileChange}
                  isUploading={uploadProgress[index] || false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={loading}
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading || formData.items.length === 0}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Save size={18} />
            {loading ? "Salvando..." : (initialData ? "Atualizar Grupo" : "Criar Grupo")}
          </button>
        </div>
      </form>
    </Modal>
  );
};