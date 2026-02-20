import { useMemo, useState } from 'react';
import { db, storage } from '../config/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export type ProductStatus = 'active' | 'inactive';
export type ProductVisibility = 'catalog' | 'physical_only' | 'hidden';
export type PublicCatalogStatus = 'public' | 'hidden';

export interface ProductFormData {
  name: string;
  description: string;

  // Varejo (categoryId/subcategoryId)
  categoryId?: string;
  subcategoryId?: string;

  // compat antigo
  category?: string;

  salePrice: number;
  costPrice: number;

  sku: string;
  barcode: string;

  // compat antigo
  gtin?: string;

  stockQuantity: number;
  minStockLevel: number;

  // ---- Visibilidade profissional ----
  status: ProductStatus;              // ativo/inativo
  visibility: ProductVisibility;      // catalog | physical_only | hidden
  catalog: {
    enabled: boolean;                 // mostrar no catálogo
    sponsored: boolean;               // patrocinado
    preorder: boolean;                // pré-venda
    hideWhenOutOfStock: boolean;      // ocultar automaticamente sem estoque
  };
  publicCatalogStatus: PublicCatalogStatus; // campo derivado para query pública

  // imagens varejo
  images: string[];

  // compat antigo
  imageUrl?: string;
  gallery?: string[];

  variants: any[];

  // produtos relacionados
  relatedProductIds?: string[];

  // Food (mantido)
  addonGroupIds: string[];
  preparationTime: number;
  isVegetarian: boolean;
  isGlutenFree: boolean;

  // Fiscal / extras (compat)
  shortDescription?: string;
  promotionalPrice?: string | number;
  promoStartDate?: string;
  promoEndDate?: string;
  weight?: string | number;
  length?: string | number;
  width?: string | number;
  height?: string | number;
  purchaseNote?: string;
  attributes?: { name: string; options: string }[];
  ncm?: string;
  cest?: string;
  origin?: string;
}

type ChangeKey = keyof ProductFormData;

function computePublicCatalogStatus(p: ProductFormData): PublicCatalogStatus {
  // se estiver hidden/physical_only, nunca vai pro catálogo online
  if (p.visibility !== 'catalog') return 'hidden';
  if (p.status !== 'active') return 'hidden';
  if (!p.catalog?.enabled) return 'hidden';

  const qty = Number(p.stockQuantity ?? 0) || 0;
  const hideOOS = Boolean(p.catalog?.hideWhenOutOfStock);

  if (hideOOS && qty <= 0) return 'hidden';

  // preorder permite aparecer mesmo com 0 estoque (se hideWhenOutOfStock estiver false)
  return 'public';
}

export const useProductForm = (initialData?: any, onSuccess?: () => void) => {
  const { userProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const initialState: ProductFormData = useMemo(
    () => ({
      name: '',
      description: '',
      categoryId: '',
      subcategoryId: '',
      category: '',

      salePrice: 0,
      costPrice: 0,
      sku: '',
      barcode: '',
      gtin: '',

      stockQuantity: 0,
      minStockLevel: 5,

      status: 'active',
      visibility: 'catalog',
      catalog: {
        enabled: true,
        sponsored: false,
        preorder: false,
        hideWhenOutOfStock: true,
      },
      publicCatalogStatus: 'public',

      images: [],
      imageUrl: '',
      gallery: [],

      variants: [],
      relatedProductIds: [],

      addonGroupIds: [],
      preparationTime: 0,
      isVegetarian: false,
      isGlutenFree: false,

      shortDescription: '',
      promotionalPrice: '',
      promoStartDate: '',
      promoEndDate: '',
      weight: '',
      length: '',
      width: '',
      height: '',
      purchaseNote: '',
      attributes: [],
      ncm: '',
      cest: '',
      origin: '0',

      ...(initialData ?? {}),
    }),
    [initialData]
  );

  const [formData, setFormData] = useState<ProductFormData>(initialState);

  const handleChange = <K extends ChangeKey>(key: K, value: ProductFormData[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value } as ProductFormData;

      // sempre recalcula quando mexer em visibilidade/estoque/status/catalog
      if (
        key === 'status' ||
        key === 'visibility' ||
        key === 'stockQuantity' ||
        key === 'catalog'
      ) {
        next.publicCatalogStatus = computePublicCatalogStatus(next);
      }

      return next;
    });
  };

  const handleUpload = async (file: File, isGallery: boolean = false) => {
    if (!userProfile?.uid) return;

    setUploading(true);
    const toastId = toast.loading('Enviando imagem...');

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '');
      const fileName = `${Date.now()}_prod_${safeName}`;

      // ✅ importante: esse path precisa bater com as STORAGE RULES
      const path = `uploads/products/${userProfile.uid}/${fileName}`;

      const storageRef = ref(storage, path);
      await uploadBytesResumable(storageRef, file, { contentType: file.type });

      const bucket = 'zeuspdv.firebasestorage.app';
      const encodedPath = encodeURIComponent(path);
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;

      setFormData((prev) => {
        const images = isGallery ? [...(prev.images || []), publicUrl] : (prev.images || []);
        const cover = images[0] ?? prev.imageUrl ?? publicUrl;

        return {
          ...prev,
          images,
          imageUrl: cover,
        };
      });

      toast.success('Imagem anexada!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Erro no upload', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || Number(formData.salePrice) <= 0) {
      toast.error('Nome e Preço de Venda são obrigatórios.');
      return;
    }

    if (!userProfile) {
      toast.error('Usuário não autenticado.');
      return;
    }

    setSaving(true);
    try {
      // ✅ businessId correto: prioriza businessId do profile, senão uid
      const resolvedBusinessId = (userProfile as any)?.businessId || (userProfile as any)?.restaurantId || userProfile.uid;

      const normalized: ProductFormData = {
        ...formData,
        salePrice: Number(formData.salePrice) || 0,
        costPrice: Number(formData.costPrice) || 0,
        stockQuantity: Number(formData.stockQuantity) || 0,
        minStockLevel: Number(formData.minStockLevel) || 0,
      };

      normalized.publicCatalogStatus = computePublicCatalogStatus(normalized);

      const productData = {
        ...normalized,
        businessId: resolvedBusinessId,
        businessType: (userProfile as any)?.businessProfile?.type,
        searchKeywords: String(normalized.name).toLowerCase().split(' ').filter(Boolean),
        updatedAt: serverTimestamp(),
      };

      if (initialData?.id) {
        await updateDoc(doc(db, 'products', initialData.id), productData);
        toast.success('Produto atualizado!');
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp(),
        });
        toast.success('Produto cadastrado!');
      }

      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar produto.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = handleSave;

  return {
    formData,
    setFormData,
    handleChange,
    handleUpload,
    handleSave,
    handleSubmit,
    saving,
    uploading,
  };
};
