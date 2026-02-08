// src/components/business/modules/SupplyFormModal.tsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useBusiness } from '../../../contexts/BusinessContext';
import { useUI } from '../../../contexts/UIContext';
import { Modal } from '../../ui/Modal';
import { FormField } from '../../ui/FormField';
import { db } from '../../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { PlusCircle, Trash2, LinkIcon, UploadCloud, Loader, Edit } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { Supply } from '../../../types';
import imageCompression from 'browser-image-compression';
import { getStorage, ref, uploadBytes } from 'firebase/storage';

interface SupplyFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: Supply | null;
}

export const SupplyFormModal: React.FC<SupplyFormModalProps> = ({ isOpen, onClose, initialData }) => {
    const { suppliers: allSuppliers, onSaveSupply, onDeleteSupplyImage, businessId } = useBusiness();
    const { showAlert, showConfirmation } = useUI();
    const storage = getStorage();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const getInitialState = useCallback((): Partial<Supply> => ({
        name: '',
        packageCost: 0,
        packageSize: 1,
        unit: 'un',
        stockQuantity: 0,
        minStockLevel: 0,
        linkedProducts: [],
        imageUrl: '',
        imagePath: ''
    }), []);
    
    const [formData, setFormData] = useState<Partial<Supply>>(getInitialState());
    const [supplierCatalogs, setSupplierCatalogs] = useState<Record<string, any[]>>({});
    const [loadingCatalogs, setLoadingCatalogs] = useState<Record<string, boolean>>({});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const data = initialData ? { ...getInitialState(), ...initialData } : getInitialState();
            setFormData(data);
            setImagePreview(data.imageUrl || '');
            setImageFile(null);
            setIsUploading(false);
        }
    }, [isOpen, initialData, getInitialState]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const fetchSupplierCatalog = useCallback(async (supplierId: string) => {
        if (supplierCatalogs[supplierId]) return;
        setLoadingCatalogs(prev => ({ ...prev, [supplierId]: true }));
        try {
            const q = query(collection(db, 'supplierProducts'), where("supplierId", "==", supplierId));
            const snapshot = await getDocs(q);
            const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSupplierCatalogs(prev => ({ ...prev, [supplierId]: products }));
        } catch (error) {
            showAlert("Erro ao buscar catálogo do fornecedor.", "error");
        } finally {
            setLoadingCatalogs(prev => ({ ...prev, [supplierId]: false }));
        }
    }, [supplierCatalogs, showAlert]);

    const handleLinkChange = (index: number, field: string, value: string) => {
        const newLinks = [...(formData.linkedProducts || [])];
        (newLinks[index] as any)[field] = value;

        if (field === 'supplierId' && value) {
            fetchSupplierCatalog(value);
            newLinks[index].productId = '';
        }
        if (field === 'productId' && value) {
            const supplierId = newLinks[index].supplierId;
            const product = supplierCatalogs[supplierId]?.find(p => p.id === value);
            if (product) {
                newLinks[index].lastPrice = product.price;
            }
        }
        setFormData(prev => ({ ...prev, linkedProducts: newLinks }));
    };
    
    const handleAddLink = () => {
        const newLink = { supplierId: '', productId: '', lastPrice: 0 };
        setFormData(prev => ({...prev, linkedProducts: [...(prev.linkedProducts || []), newLink]}));
    };

    const handleRemoveLink = (index: number) => {
        setFormData(prev => ({ ...prev, linkedProducts: prev.linkedProducts?.filter((_, i) => i !== index) }));
    };

    const handleFileChange = async (file: File) => {
        if (!file) return;
        const options = { 
            maxSizeMB: 1, 
            maxWidthOrHeight: 1024, 
            useWebWorker: true, 
            fileType: 'image/webp' 
        };
        try {
            showAlert("Otimizando imagem...", "info");
            const compressedFile = await imageCompression(file, options);
            setImageFile(compressedFile);
            setImagePreview(URL.createObjectURL(compressedFile));
        } catch (error) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (!formData.imageUrl && !imagePreview) return;
        showConfirmation('Deseja remover a imagem deste insumo?', async () => {
            if (formData.imagePath) {
                try {
                    await onDeleteSupplyImage(formData.imagePath);
                    setFormData(prev => ({...prev, imageUrl: '', imagePath: ''}));
                } catch(error) {
                    showAlert('Erro ao remover imagem.', 'error');
                }
            }
            setImageFile(null);
            setImagePreview('');
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!businessId) {
            showAlert("Erro crítico: ID do negócio não encontrado.", "error");
            return;
        }
        setIsUploading(true);
        try {
            const savedSupply = await onSaveSupply(formData, !!initialData);
            const supplyId = initialData?.id || savedSupply.id;
            
            if (imageFile) {
                if (formData.imagePath) {
                    await onDeleteSupplyImage(formData.imagePath);
                }
                const filePath = `uploads/supply_${supplyId}_${Date.now()}.webp`;
                const storageRef = ref(storage, filePath);
                const metadata = { customMetadata: { supplyId, businessId } };
                await uploadBytes(storageRef, imageFile, metadata);
            }

            showAlert("Insumo salvo! A imagem será processada em segundo plano.", "success");
            onClose();
        } catch (error: any) {
            showAlert(`Falha ao salvar: ${error.message}`, "error");
        } finally {
            setIsUploading(false);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Editar Insumo' : 'Novo Insumo'} size="4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Coluna da Imagem */}
                    <div className="lg:col-span-1">
                         <FormField label="Imagem do Insumo">
                            <div
                                onClick={() => !isUploading && fileInputRef.current?.click()}
                                onDrop={(e) => { 
                                    e.preventDefault(); 
                                    e.dataTransfer.files && handleFileChange(e.dataTransfer.files[0]); 
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                className="relative w-full aspect-square bg-gray-50 border-2 border-dashed rounded-lg flex items-center justify-center text-center text-gray-500 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                <input 
                                    ref={fileInputRef} 
                                    type="file" 
                                    onChange={(e) => e.target.files && handleFileChange(e.target.files[0])} 
                                    className="hidden" 
                                    accept="image/*" 
                                    disabled={isUploading}
                                />
                                {isUploading ? (
                                    <div className="flex flex-col items-center text-blue-600">
                                        <Loader className="animate-spin" size={48} />
                                        <p className="mt-2 font-semibold">Enviando...</p>
                                    </div>
                                ) : imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                        <button 
                                            type="button" 
                                            onClick={handleRemoveImage} 
                                            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 shadow-lg hover:bg-red-700 transition-transform hover:scale-110"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center p-4 text-gray-400">
                                        <UploadCloud size={40} />
                                        <p className="mt-2 font-semibold text-gray-600">Arraste a imagem</p>
                                        <p className="text-sm">ou clique para selecionar</p>
                                    </div>
                                )}
                            </div>
                        </FormField>
                    </div>
                    
                    {/* Coluna dos Dados */}
                    <div className="lg:col-span-2 space-y-4">
                        <FormField label="Nome do Insumo">
                            <input 
                                name="name" 
                                value={formData.name || ''} 
                                onChange={handleChange} 
                                required 
                                className="w-full p-2 border rounded" 
                            />
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                           <FormField label="Unidade de Medida">
                                <select 
                                    name="unit" 
                                    value={formData.unit || 'un'} 
                                    onChange={handleChange} 
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="g">g</option>
                                    <option value="kg">kg</option>
                                    <option value="ml">ml</option>
                                    <option value="L">L</option>
                                    <option value="un">un</option>
                                </select>
                            </FormField>
                           <FormField label="Estoque Mínimo">
                                <input 
                                    name="minStockLevel" 
                                    type="number" 
                                    value={formData.minStockLevel || 0} 
                                    onChange={handleChange} 
                                    className="w-full p-2 border rounded" 
                                />
                            </FormField>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <FormField label="Custo do Pacote (R$)">
                                <input 
                                    name="packageCost" 
                                    type="number" 
                                    step="0.01" 
                                    value={formData.packageCost || 0} 
                                    onChange={handleChange} 
                                    className="w-full p-2 border rounded" 
                                />
                            </FormField>
                           <FormField label="Tamanho do Pacote">
                                <input 
                                    name="packageSize" 
                                    type="number" 
                                    value={formData.packageSize || 1} 
                                    onChange={handleChange} 
                                    className="w-full p-2 border rounded" 
                                />
                            </FormField>
                        </div>
                    </div>
                </div>
                
                {/* Seção de Vínculos */}
                <div className="p-4 border rounded-lg bg-white">
                    <h3 className="font-bold text-lg mb-4 text-gray-700 flex items-center gap-2">
                        <LinkIcon /> 
                        Conexão Nexus: Vincule Fornecedores a este Insumo
                    </h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {formData.linkedProducts?.map((link, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-md">
                                <div className="col-span-5">
                                    <FormField label="Fornecedor">
                                        <select 
                                            value={link.supplierId} 
                                            onChange={(e) => handleLinkChange(index, 'supplierId', e.target.value)} 
                                            required 
                                            className="w-full p-2 border rounded"
                                        >
                                            {!link.supplierId && <option value="" disabled>Selecione</option>}
                                            {allSuppliers.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </FormField>
                                </div>
                                <div className="col-span-5">
                                    <FormField label="Produto do Fornecedor">
                                        <select 
                                            value={link.productId} 
                                            onChange={(e) => handleLinkChange(index, 'productId', e.target.value)} 
                                            disabled={!link.supplierId || loadingCatalogs[link.supplierId]} 
                                            required 
                                            className="w-full p-2 border rounded"
                                        >
                                            {loadingCatalogs[link.supplierId] ? (
                                                <option>Carregando...</option>
                                            ) : (
                                                <>
                                                    <option value="" disabled>Selecione</option>
                                                    {supplierCatalogs[link.supplierId]?.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.productName} ({formatCurrency(p.price)})
                                                        </option>
                                                    ))}
                                                </>
                                            )}
                                        </select>
                                    </FormField>
                                </div>
                                <div className="col-span-2">
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveLink(index)} 
                                        className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 w-full"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button 
                        type="button" 
                        onClick={handleAddLink} 
                        className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center font-semibold"
                    >
                        <PlusCircle size={16} className="mr-1" /> 
                        Vincular novo Fornecedor
                    </button>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={isUploading} 
                        className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {isUploading ? 'Salvando...' : 'Salvar Insumo'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};