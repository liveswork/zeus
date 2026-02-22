// src/components/business/retail/modules/pdv/RetailPDVManager.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronsLeft,
  XCircle,
  ShoppingCart,
  Trash2,
  UserPlus,
  Search,
  X,
  Minus,
  Plus,
  Settings,
} from 'lucide-react';

import { collection, doc, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../../../../../config/firebase';

import { useBusiness } from '../../../../../contexts/BusinessContext';
import { useUI } from '../../../../../contexts/UIContext';
import { useAuth } from '../../../../../contexts/AuthContext';
import { formatCurrency } from '../../../../../utils/formatters';

import { useRetailPrintManager } from './hooks/useRetailPrintManager';
import { RetailPrintSettingsModal } from './RetailPrintSettingsModal';
import { PdvPaymentModal } from './PdvPaymentModal';

type CartItem = {
  id: string;
  name: string;
  salePrice: number;
  qty: number;

  sku?: string;
  barcode?: string;
  gtin?: string;

  categoryId?: string;
  subcategoryId?: string;

  imageUrl?: string;
  images?: string[];

  stockQuantity?: number;
  isActive?: boolean;
  hideInPDV?: boolean;

  [key: string]: any;
};

type LocalCustomer = {
  id: string;
  name: string;
  phone?: string;
  phoneNumber?: string;
  mobile?: string;
  whatsapp?: string;
  customerPhone?: string;
  [key: string]: any;
};

function onlyDigits(v: any) {
  return String(v ?? '').replace(/\D/g, '');
}

function normalizeText(v: any) {
  return String(v ?? '').trim().toLowerCase();
}

function getCustomerPhone(c: LocalCustomer | null) {
  if (!c) return '';
  return c.phone || c.phoneNumber || c.mobile || c.whatsapp || c.customerPhone || '';
}

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if ((el as any).isContentEditable) return true;
  return false;
}

/** Modo compacto por altura (PDV enterprise) */
function useCompactMode() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-height: 800px)');
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  return compact;
}

/** Detecta touch / ponteiro grosseiro (alvos maiores) */
function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return coarse;
}

/** Beep PDV (ok/erro) — não pode travar a UI */
function useBeep() {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback((type: 'ok' | 'err') => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!ctxRef.current) ctxRef.current = new AudioCtx();
      const ctx = ctxRef.current;

      if (ctx.state === 'suspended') ctx.resume();

      const o = ctx.createOscillator();
      const g = ctx.createGain();

      o.type = 'sine';
      o.frequency.value = type === 'ok' ? 880 : 220;

      g.gain.value = 0.0001;
      g.gain.exponentialRampToValueAtTime(type === 'ok' ? 0.12 : 0.18, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.11);

      o.connect(g);
      g.connect(ctx.destination);

      o.start();
      o.stop(ctx.currentTime + 0.12);
    } catch {
      // sem impacto
    }
  }, []);

  return { playBeep: play };
}

/* -------------------------------------------------------------------------- */
/* Modal simples: buscar cliente (telefone/nome)                               */
/* -------------------------------------------------------------------------- */

function CustomerLookupModal({
  isOpen,
  onClose,
  customers,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  customers: LocalCustomer[];
  onSelect: (c: LocalCustomer | null) => void;
}) {
  const [term, setTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTerm('');
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const t = normalizeText(term);
    const digits = onlyDigits(term);

    if (!t) return customers.slice(0, 30);

    return customers
      .filter((c) => {
        const name = normalizeText(c?.name);
        const phone = onlyDigits(getCustomerPhone(c));
        return name.includes(t) || (digits && phone.includes(digits));
      })
      .slice(0, 50);
  }, [customers, term]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Selecionar Cliente</h3>
            <p className="text-xs text-gray-500">Buscar por telefone ou nome</p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              ref={inputRef}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Ex.: 81999999999 ou Maria"
              className="w-full border rounded-lg pl-10 pr-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[360px] overflow-y-auto">
              <button
                type="button"
                onClick={() => onSelect(null)}
                className="w-full text-left px-4 py-3 text-sm font-semibold border-b hover:bg-gray-50"
              >
                Cliente Balcão (Não identificado)
              </button>

              {filtered.length === 0 ? (
                <div className="p-6 text-sm text-gray-500 text-center">Nenhum cliente encontrado.</div>
              ) : (
                filtered.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => onSelect(c)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div className="font-semibold text-gray-900">{c.name || '(Sem nome)'}</div>
                    <div className="text-xs text-gray-500">{getCustomerPhone(c) || '-'}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="text-xs text-gray-400">
            Atalhos: <b>F4</b> Cliente • <b>F2</b> Cancelar • <b>F12</b> Finalizar
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* RetailPDVManager                                                           */
/* -------------------------------------------------------------------------- */

export const RetailPDVManager: React.FC = () => {
  const { products, localCustomers, businessId } = useBusiness();
  const { showAlert } = useUI();
  const { printRetailSale } = useRetailPrintManager();
  const { userProfile } = useAuth();

  // ✅ opção "Permitir vender com estoque negativo" (salva em printSettings.retailPdv.allowNegativeStock)
  const allowNegativeStock = useMemo(() => {
    const anyProfile: any = userProfile || {};
    const cfg =
      anyProfile?.printSettings?.retailPdv ||
      anyProfile?.retailPdvPrintSettings ||
      null;
    return Boolean(cfg?.allowNegativeStock);
  }, [userProfile]);

  const compact = useCompactMode();
  const coarse = useCoarsePointer();
  const { playBeep } = useBeep();

  const [isCaixaOpen, setIsCaixaOpen] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [inputCode, setInputCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<LocalCustomer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isPrintSettingsOpen, setIsPrintSettingsOpen] = useState(false);

  // ✅ trava PDV durante pagamento
  const lockPOS = isPaymentOpen;

  // seleção de linha (PDV varejista)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // refs para auto-scroll / foco qty
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const qtyRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const focusMainInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // foco no input quando abrir caixa e quando destravar
  useEffect(() => {
    if (!isCaixaOpen) return;
    if (lockPOS) return;
    focusMainInput();
  }, [isCaixaOpen, lockPOS, focusMainInput]);

  const totalAmount = useMemo(
    () => cart.reduce((sum, i) => sum + (Number(i.salePrice) || 0) * (Number(i.qty) || 0), 0),
    [cart]
  );

  const cartItemCount = useMemo(
    () => cart.reduce((sum, i) => sum + (Number(i.qty) || 0), 0),
    [cart]
  );

  const sellableProducts = useMemo(() => {
    return (products || []).filter((p: any) => (p?.isActive ?? true) === true);
  }, [products]);

  const findProduct = useCallback(
    (raw: string) => {
      const term = normalizeText(raw);
      const digits = onlyDigits(raw);
      if (!term) return null;

      if (digits) {
        const foundByEan = sellableProducts.find((p: any) => {
          const pGtin = onlyDigits(p?.gtin);
          const pBarcode = onlyDigits(p?.barcode);
          return (pGtin && pGtin === digits) || (pBarcode && pBarcode === digits);
        });
        if (foundByEan) return foundByEan;
      }

      const foundBySku = sellableProducts.find((p: any) => normalizeText(p?.sku) === term);
      if (foundBySku) return foundBySku;

      const foundByName = sellableProducts.find((p: any) => normalizeText(p?.name).includes(term));
      if (foundByName) return foundByName;

      return null;
    },
    [sellableProducts]
  );

  const addToCart = useCallback(
    (product: any, qtyDelta: number = 1) => {
      if (!product?.id) return;

      if (product?.isActive === false) {
        showAlert('Este produto está inativo e não pode ser vendido.');
        return;
      }
      if (product?.hideInPDV === true) {
        showAlert('Este produto está oculto no PDV.');
        return;
      }

      setCart((prev) => {
        const idx = prev.findIndex((x) => x.id === product.id);
        if (idx >= 0) {
          const next = [...prev];
          const nextQty = (Number(next[idx].qty) || 0) + qtyDelta;
          if (nextQty <= 0) return prev.filter((x) => x.id !== product.id);
          next[idx] = { ...next[idx], qty: nextQty };
          return next;
        }
        return [...prev, { ...product, qty: Math.max(1, qtyDelta) }];
      });
    },
    [showAlert]
  );

  const removeItem = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((x) => x.id !== itemId));
  }, []);

  const setQty = useCallback(
    (itemId: string, qty: number) => {
      const q = Number(qty) || 0;
      if (q <= 0) return removeItem(itemId);
      setCart((prev) => prev.map((x) => (x.id === itemId ? { ...x, qty: q } : x)));
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedCustomer(null);
    setInputCode('');
    setSelectedIndex(-1);
  }, []);

  const openPayment = useCallback(() => {
    if (cart.length === 0) {
      showAlert('Adicione produtos ao carrinho para finalizar a venda.');
      return;
    }
    setIsPaymentOpen(true);
  }, [cart.length, showAlert]);

  // Auto-seleciona último item e mantém seleção válida
  useEffect(() => {
    if (cart.length === 0) {
      setSelectedIndex(-1);
      return;
    }
    setSelectedIndex((prev) => {
      if (prev >= 0 && prev < cart.length) return prev;
      return cart.length - 1;
    });
  }, [cart.length]);

  // Auto-scroll para item selecionado
  useEffect(() => {
    if (selectedIndex < 0) return;
    const item = cart[selectedIndex];
    if (!item?.id) return;
    const el = rowRefs.current[item.id];
    el?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [cart, selectedIndex]);

  const handleLookup = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (lockPOS) return;

      const raw = inputCode.trim();
      if (!raw) return;

      const found = findProduct(raw);
      if (!found) {
        playBeep('err');
        showAlert(`Produto não encontrado: "${raw}"`);
        setInputCode('');
        focusMainInput();
        return;
      }

      playBeep('ok');
      addToCart(found, 1);
      setInputCode('');
      focusMainInput();

      // Seleciona o item recém adicionado (ou último)
      setTimeout(() => {
        setSelectedIndex(() => {
          const idx = (cart || []).findIndex((x) => x.id === found.id);
          if (idx >= 0) return idx;
          return Math.max(0, cart.length);
        });
      }, 0);
    },
    [addToCart, cart, findProduct, focusMainInput, inputCode, lockPOS, playBeep, showAlert]
  );

  const handleUpdateItemsFromModal = useCallback((items: any[]) => {
    setCart(items || []);
  }, []);

  const handleRemoveItemFromModal = useCallback(
    (itemId: string) => {
      removeItem(itemId);
    },
    [removeItem]
  );

  /**
   * ✅ TRAVA ESC durante pagamento (evita fechar modal por acidente).
   * Fazemos isso em CAPTURE e paramos a propagação imediatamente.
   */
  useEffect(() => {
    if (!lockPOS) return;

    const onKeyCapture = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        // @ts-ignore
        e.stopImmediatePropagation?.();
      }
    };

    window.addEventListener('keydown', onKeyCapture, { capture: true });
    return () => window.removeEventListener('keydown', onKeyCapture, { capture: true } as any);
  }, [lockPOS]);

  // atalhos PDV
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isCaixaOpen) return;

      // durante pagamento: PDV inteiro travado
      if (lockPOS) return;

      // Navegação do carrinho (quando não estiver digitando em input)
      if (!isTypingTarget(e.target) && cart.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((i) => Math.min(cart.length - 1, Math.max(0, i + 1)));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((i) => Math.max(0, i - 1));
          return;
        }
        if (e.key === 'Delete') {
          e.preventDefault();
          const item = cart[selectedIndex];
          if (item?.id) removeItem(item.id);
          return;
        }
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          const item = cart[selectedIndex];
          if (item?.id) addToCart(item, 1);
          return;
        }
        if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          const item = cart[selectedIndex];
          if (item?.id) addToCart(item, -1);
          return;
        }
        if (e.key === 'Enter') {
          const item = cart[selectedIndex];
          if (item?.id && qtyRefs.current[item.id]) {
            e.preventDefault();
            qtyRefs.current[item.id]?.focus();
            qtyRefs.current[item.id]?.select?.();
            return;
          }
        }
      }

      if (isTypingTarget(e.target)) return;

      if (e.key === 'F12') {
        e.preventDefault();
        openPayment();
        return;
      }
      if (e.key === 'F2') {
        e.preventDefault();
        clearCart();
        showAlert('Venda cancelada (carrinho limpo).');
        focusMainInput();
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setIsCustomerModalOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    addToCart,
    cart,
    clearCart,
    focusMainInput,
    isCaixaOpen,
    lockPOS,
    openPayment,
    removeItem,
    selectedIndex,
    showAlert,
  ]);

  /**
   * ✅ Finalizar venda:
   * - valida estoque (se !allowNegativeStock)
   * - dá baixa (increment(-qty))
   * - salva a venda
   * Tudo numa única transação (consistência).
   */
  const handleConfirmPayment = useCallback(
    async (payload: {
      payments: Array<{ method: string; amountPaid: number; change: number }>;
      discount: number;
      surcharge: number;
      finalAmount: number;
      items: any[];
    }) => {
      try {
        if (!businessId) {
          showAlert('businessId não encontrado.');
          return;
        }

        const nowISO = new Date().toISOString();

        const items = (payload.items || cart || []).map((i: any) => ({
          id: i.id,
          productId: i.id,
          name: i.name,
          qty: Number(i.qty) || 0,
          salePrice: Number(i.salePrice) || 0,

          sku: i.sku || '',
          barcode: i.barcode || '',
          gtin: i.gtin || '',

          categoryId: i.categoryId || '',
          subcategoryId: i.subcategoryId || '',
          category: i.category || '',

          imageUrl: i.imageUrl || i.images?.[0] || '',

          businessId,

          stockQuantity: Number(i.stockQuantity) || 0,
          costPrice: Number(i.costPrice) || 0,
          showInCatalog: Boolean(i.showInCatalog ?? false),

          createdAt: i.createdAt || nowISO,
          updatedAt: nowISO,
        }));

        const subtotal = items.reduce((sum: number, i: any) => sum + i.salePrice * i.qty, 0);
        const finalAmount =
          Number(payload.finalAmount) ||
          Math.max(0, subtotal - (payload.discount || 0) + (payload.surcharge || 0));

        const saleRef = doc(collection(db, 'sales'));

        const saleDoc = {
          id: saleRef.id,
          businessId,
          createdBy: businessId,

          status: 'completed',
          origin: 'balcao',
          orderType: 'balcao',

          customerId: selectedCustomer?.id || '',
          customerName: selectedCustomer?.name || 'Cliente Balcão',
          customerPhone: getCustomerPhone(selectedCustomer) || '',

          items,

          totalAmount: subtotal,
          finalAmount,

          discount: Number(payload.discount) || 0,
          surcharge: Number(payload.surcharge) || 0,

          paymentDetails: payload.payments || [],

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          finishedAt: new Date(),

          deliveryFee: 0,
          deliveryAddress: '',
          addressDetails: null,

          observations: '',
        };

        await runTransaction(db, async (tx) => {
          // refs/snapshots
          const refs = items.map((it: any) => doc(db, 'products', it.productId || it.id));
          const snaps = await Promise.all(refs.map((r) => tx.get(r)));

          // valida
          if (!allowNegativeStock) {
            for (let i = 0; i < items.length; i++) {
              const it = items[i];
              const qty = Number(it.qty) || 0;
              if (qty <= 0) continue;

              const snap = snaps[i];
              if (!snap.exists()) {
                throw new Error(`Produto não encontrado: ${it.name || it.productId || it.id}`);
              }

              const current = Number((snap.data() as any)?.stockQuantity ?? 0);
              if (current < qty) {
                throw new Error(`Estoque insuficiente: ${it.name} (disp: ${current}, precisa: ${qty})`);
              }
            }
          }

          // baixa
          for (let i = 0; i < items.length; i++) {
            const it = items[i];
            const qty = Number(it.qty) || 0;
            if (qty <= 0) continue;

            tx.update(refs[i], {
              stockQuantity: increment(-qty),
              updatedAt: serverTimestamp(),
            });
          }

          // salva venda
          tx.set(saleRef, saleDoc);
        });

        // impressão fora da transação
        await printRetailSale({ ...saleDoc });

        setCart([]);
        setSelectedCustomer(null);
        setIsPaymentOpen(false);
        setSelectedIndex(-1);
        showAlert('Venda finalizada com sucesso!');
        focusMainInput();
      } catch (err: any) {
        console.error('[RetailPDVManager] erro ao finalizar venda:', err);
        showAlert(err?.message || 'Erro ao finalizar venda.');
      }
    },
    [
      allowNegativeStock,
      businessId,
      cart,
      focusMainInput,
      printRetailSale,
      selectedCustomer,
      showAlert,
    ]
  );

  const handleCloseCaixa = useCallback(() => {
    if (cart.length > 0) {
      const ok = window.confirm('Existem itens no carrinho. Deseja realmente fechar o caixa?');
      if (!ok) return;
    }
    setIsCaixaOpen(false);
    clearCart();
    setIsPaymentOpen(false);
    setIsCustomerModalOpen(false);
    setIsPrintSettingsOpen(false);
  }, [cart.length, clearCart]);

  if (!isCaixaOpen) {
    return (
      <div className="w-full h-[100dvh] flex flex-col justify-center items-center bg-gray-700 text-white">
        <h1 className="text-5xl font-bold">Caixa Fechado</h1>
        <p className="text-xl mt-2">Clique abaixo para iniciar as operações do dia.</p>
        <button
          onClick={() => setIsCaixaOpen(true)}
          className="mt-8 bg-green-600 text-white font-bold py-4 px-10 rounded-lg text-2xl hover:bg-green-700 transition"
        >
          Abrir Caixa
        </button>
      </div>
    );
  }

  // classes adaptativas (touch + compact)
  const qtyBtnClass = coarse ? 'w-12 h-12' : compact ? 'w-11 h-11' : 'w-10 h-10';
  const qtyInputClass = coarse ? 'w-24 h-12 text-lg' : compact ? 'w-20 h-11' : 'w-20 h-10';

  const SidebarContent = (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="text-white text-center w-full max-w-[260px]">
        <ShoppingCart size={64} className="mx-auto mb-4" />
        <h2 className="text-2xl font-bold">RETAIL PDV</h2>
        <p className="text-gray-300">Caixa • Varejo</p>

        <button
          type="button"
          onClick={() => setIsPrintSettingsOpen(true)}
          className="mt-6 inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white px-4 py-2 rounded-lg disabled:opacity-60"
          disabled={lockPOS}
          title={lockPOS ? 'Pagamento em andamento' : 'Configurar impressão'}
        >
          <Settings size={18} />
          Impressão (Config)
        </button>

        <div className="mt-6 space-y-2 text-sm">
          <div className="text-gray-200 font-semibold">
            Itens: <span className="font-bold">{cartItemCount}</span>
          </div>
          <div className="text-gray-200 font-semibold">
            Total: <span className="font-bold">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="text-xs text-gray-300 mt-2">
            {selectedCustomer ? (
              <>
                Cliente: <span className="font-bold">{selectedCustomer.name}</span>
              </>
            ) : (
              <>Cliente Balcão</>
            )}
          </div>
          <div className="text-[11px] text-gray-300 mt-3">
            Estoque negativo:{' '}
            <span className="font-bold">{allowNegativeStock ? 'PERMITIDO' : 'BLOQUEADO'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="h-[100dvh] w-full bg-slate-100 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]">
          {/* Sidebar (lg+) */}
          <aside className="hidden lg:block bg-gray-800">{SidebarContent}</aside>

          {/* Main */}
          <main className="min-w-0 h-full flex flex-col relative">
            {/* Overlay PDV durante pagamento */}
            {lockPOS && (
              <div className="absolute inset-0 z-30 flex items-start justify-center pointer-events-none">
                <div className="mt-4 bg-amber-100 border border-amber-300 text-amber-900 px-4 py-2 rounded-xl shadow">
                  Pagamento em andamento — PDV bloqueado
                </div>
              </div>
            )}

            <div className={lockPOS ? 'pointer-events-none opacity-80' : ''}>
              {/* Top Summary Bar (sm/md) */}
              <div className="lg:hidden bg-gray-800 text-white border-b border-white/10">
                <div className={`px-3 ${compact ? 'py-2' : 'py-3'} flex items-center justify-between gap-3`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <ShoppingCart size={22} className="shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold leading-tight truncate">RETAIL PDV</div>
                      <div className="text-xs text-gray-300 truncate">
                        Itens: <b>{cartItemCount}</b> • Total: <b>{formatCurrency(totalAmount)}</b>
                        {selectedCustomer ? ` • ${selectedCustomer.name}` : ' • Cliente Balcão'}
                      </div>
                      <div className="text-[11px] text-gray-300">
                        Estoque negativo: <b>{allowNegativeStock ? 'PERMITIDO' : 'BLOQUEADO'}</b>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPrintSettingsOpen(true)}
                    disabled={lockPOS}
                    className="shrink-0 inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white px-3 py-2 rounded-lg disabled:opacity-60"
                    title="Configurar impressão"
                  >
                    <Settings size={16} />
                    <span className="hidden sm:inline">Impressão</span>
                  </button>
                </div>
              </div>

              {/* Header */}
              <header className={`flex-shrink-0 ${compact ? 'px-3 py-2' : 'px-4 py-3'} flex items-center justify-between gap-3`}>
                <Link
                  to="/painel/dashboard"
                  className="bg-gray-200 text-gray-800 py-2 px-3 rounded-lg flex items-center gap-2 hover:bg-gray-300 transition whitespace-nowrap"
                >
                  <ChevronsLeft size={18} /> <span className="hidden sm:inline">Voltar ao Painel</span>
                </Link>

                <div className="text-right min-w-0">
                  <div className="text-lg sm:text-xl font-extrabold text-gray-900">CAIXA 001</div>
                  <div className="text-xs text-gray-500">
                    F12 Finaliza • F2 Cancela • F4 Cliente • ↑↓ Seleciona • Del Remove • +/- Qtd • Enter Qtd
                  </div>
                </div>

                <button
                  onClick={handleCloseCaixa}
                  className="bg-red-500 text-white py-2 px-3 rounded-lg flex items-center gap-2 hover:bg-red-600 transition whitespace-nowrap"
                >
                  <XCircle size={18} /> <span className="hidden sm:inline">Fechar Caixa</span>
                </button>
              </header>

              {/* Input scanner/busca */}
              <form onSubmit={handleLookup} className={`flex-shrink-0 ${compact ? 'px-3 pt-1' : 'px-4 pt-2'}`}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder={lockPOS ? 'Pagamento em andamento...' : 'Ler EAN/GTIN ou digitar Nome/SKU e Enter'}
                  disabled={lockPOS}
                  className={`
                    w-full ${compact ? 'h-12 text-base' : 'h-14 text-lg'}
                    rounded-xl border-2 px-4
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${lockPOS ? 'bg-amber-50 border-amber-300 text-gray-500 cursor-not-allowed' : 'bg-white border-gray-300'}
                  `}
                />
              </form>

              {/* Cliente + ações */}
              <div className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} flex flex-wrap items-center gap-2`}>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  disabled={lockPOS}
                  className="bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-60"
                  title="F4"
                >
                  <UserPlus size={18} />
                  Informar cliente
                </button>

                {selectedCustomer ? (
                  <div className="flex-1 min-w-[220px] bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-blue-900 truncate">{selectedCustomer.name}</div>
                      <div className="text-xs text-blue-700 truncate">{getCustomerPhone(selectedCustomer) || 'sem telefone'}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      disabled={lockPOS}
                      className="text-blue-900 hover:bg-blue-100 rounded-lg px-3 py-1.5 disabled:opacity-60 whitespace-nowrap"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-w-[220px] text-sm text-gray-500">
                    Cliente padrão: <span className="font-semibold">Cliente Balcão</span>
                  </div>
                )}

                <div className="text-sm text-gray-600 whitespace-nowrap">
                  Itens: <b>{cartItemCount}</b>
                </div>
              </div>

              {/* Carrinho */}
              <div className={`${compact ? 'px-3 pb-2' : 'px-4 pb-3'} flex-1 min-h-0`}>
                <div className="h-full bg-white rounded-xl shadow-inner overflow-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-50 z-10">
                      <tr className="text-left text-gray-600">
                        <th className="p-3 w-1/2">Item</th>
                        <th className="p-3 w-44">Qtd.</th>
                        <th className="p-3">Vl. Unit.</th>
                        <th className="p-3 text-right">Subtotal</th>
                        <th className="p-3 text-right w-20">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, idx) => {
                        const isSelected = cart[selectedIndex]?.id === item.id;

                        return (
                          <tr
                            key={item.id}
                            ref={(el) => {
                              rowRefs.current[item.id] = el;
                            }}
                            className={`border-b last:border-b-0 ${isSelected ? 'bg-blue-50' : ''}`}
                            onClick={() => setSelectedIndex(idx)}
                          >
                            <td className="p-3">
                              <div className="font-semibold text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-400">
                                {item.gtin
                                  ? `EAN: ${item.gtin}`
                                  : item.barcode
                                  ? `Código: ${item.barcode}`
                                  : item.sku
                                  ? `SKU: ${item.sku}`
                                  : ''}
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => addToCart(item, -1)}
                                  disabled={lockPOS}
                                  className={`${qtyBtnClass} rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center disabled:opacity-60`}
                                  title="Diminuir"
                                >
                                  <Minus size={16} />
                                </button>

                                <input
                                  ref={(el) => {
                                    qtyRefs.current[item.id] = el;
                                  }}
                                  type="number"
                                  min={1}
                                  value={item.qty}
                                  onChange={(e) => setQty(item.id, Number(e.target.value))}
                                  disabled={lockPOS}
                                  className={`${qtyInputClass} text-center border border-gray-300 rounded-lg px-2 disabled:bg-gray-100 disabled:text-gray-500`}
                                />

                                <button
                                  type="button"
                                  onClick={() => addToCart(item, 1)}
                                  disabled={lockPOS}
                                  className={`${qtyBtnClass} rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center disabled:opacity-60`}
                                  title="Aumentar"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            </td>

                            <td className="p-3">{formatCurrency(item.salePrice)}</td>

                            <td className="p-3 text-right font-bold">
                              {formatCurrency((Number(item.salePrice) || 0) * (Number(item.qty) || 0))}
                            </td>

                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                disabled={lockPOS}
                                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-60"
                                title="Excluir item"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {cart.length === 0 && <p className="text-center text-gray-400 p-10">Aguardando itens...</p>}
                </div>
              </div>

              {/* Footer */}
              <footer
                className={`
                  mt-auto flex-shrink-0
                  bg-slate-100/95 backdrop-blur
                  border-t border-slate-200
                  ${compact ? 'p-2' : 'p-3 md:p-4'}
                  [padding-bottom:calc(env(safe-area-inset-bottom)+12px)]
                `}
              >
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={lockPOS}
                      onClick={() => {
                        clearCart();
                        showAlert('Venda cancelada (carrinho limpo).');
                      }}
                      className={`${compact ? 'h-10' : 'h-11'} px-4 rounded-lg bg-slate-600 text-white font-semibold hover:bg-slate-700 disabled:opacity-60`}
                      title="F2"
                    >
                      Cancelar (F2)
                    </button>

                    <button
                      disabled={lockPOS}
                      onClick={() => setIsCustomerModalOpen(true)}
                      className={`${compact ? 'h-10' : 'h-11'} px-4 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-60`}
                      title="F4"
                    >
                      Cliente (F4)
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:flex md:items-end md:justify-end md:gap-4">
                    <div className="text-left md:text-right">
                      <div className="text-xs md:text-sm text-slate-500 font-semibold">Total da Venda</div>
                      <div
                        className={`font-extrabold text-blue-600 leading-none ${
                          compact ? 'text-3xl' : 'text-3xl sm:text-4xl lg:text-5xl'
                        }`}
                      >
                        {formatCurrency(totalAmount)}
                      </div>
                    </div>

                    <button
                      disabled={lockPOS || cart.length === 0}
                      onClick={openPayment}
                      className={`${compact ? 'h-12 text-lg' : 'h-14 text-lg md:text-xl'} px-5 md:px-8 rounded-xl bg-emerald-600 text-white font-extrabold hover:bg-emerald-700 disabled:bg-slate-400`}
                      title="F12"
                    >
                      Finalizar (F12)
                    </button>
                  </div>
                </div>
              </footer>
            </div>
          </main>
        </div>
      </div>

      {/* Modal: Cliente */}
      <CustomerLookupModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          focusMainInput();
        }}
        customers={(localCustomers as any) || []}
        onSelect={(c) => {
          setSelectedCustomer(c);
          setIsCustomerModalOpen(false);
          focusMainInput();
        }}
      />

      {/* Modal: Pagamento */}
      {isPaymentOpen && (
        <PdvPaymentModal
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false);
            focusMainInput();
          }}
          businessId={businessId || ''}
          customers={(localCustomers as any) || []}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={(c) => setSelectedCustomer(c)}
          items={cart}
          onUpdateItems={handleUpdateItemsFromModal}
          onRemoveItem={handleRemoveItemFromModal}
          onConfirm={handleConfirmPayment}
        />
      )}

      {/* Modal: Config Impressão */}
      {isPrintSettingsOpen && (
        <RetailPrintSettingsModal
          isOpen={isPrintSettingsOpen}
          onClose={() => {
            setIsPrintSettingsOpen(false);
            focusMainInput();
          }}
        />
      )}
    </>
  );
};

export default RetailPDVManager;