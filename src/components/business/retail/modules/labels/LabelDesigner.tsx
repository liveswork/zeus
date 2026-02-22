// src/components/business/retail/modules/labels/LabelDesigner.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import Barcode from 'react-barcode';
import { addDoc, getDoc, updateDoc, collection, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../../config/firebase';
import { useBusiness } from '../../../../../contexts/BusinessContext';
import { Type, DollarSign, Barcode as BarcodeIcon, Save, Loader, Printer, X, Maximize, Image } from 'lucide-react';
import { formatCurrency } from '../../../../../utils/formatters';
import type { LabelTemplate, Product } from '../../../../../types';

const PRESET_SIZES = [
  { name: '30x20', width: 30, height: 20 },
  { name: '30x30', width: 30, height: 30 },
  { name: '30x40', width: 30, height: 40 },
  { name: '30x50', width: 30, height: 50 },
  { name: '30x60', width: 30, height: 60 },
  { name: '30x70', width: 30, height: 70 },
  { name: '30x80', width: 30, height: 80 },
  { name: '50x20', width: 50, height: 20 },
  { name: '50x30', width: 50, height: 30 },
  { name: '50x40', width: 50, height: 40 },
  { name: '50x50', width: 50, height: 50 },
  { name: '50x60', width: 50, height: 60 },
  { name: '50x70', width: 50, height: 70 },
  { name: '50x80', width: 50, height: 80 },
  { name: '80x20', width: 80, height: 20 },
  { name: '80x30', width: 80, height: 30 },
  { name: '80x40', width: 80, height: 40 },
  { name: '80x50', width: 80, height: 50 },
  { name: '80x60', width: 80, height: 60 },
  { name: '80x70', width: 80, height: 70 },
  { name: '80x80', width: 80, height: 80 },
  { name: '80x90', width: 80, height: 90 },
  { name: '100x50', width: 100, height: 50 },
] as const;

type PresetSize = (typeof PRESET_SIZES)[number];
type ElementType = 'productName' | 'price' | 'barcode' | 'logo';

type LabelElement = {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  rotation?: number;
};

type Props = {
  product: Product;

  initialTemplate?: LabelTemplate | null;
  onSave: () => void;
  onClose: () => void;
};

export const LabelDesigner: React.FC<Props> = ({ product, initialTemplate, onSave, onClose }) => {
  const { businessId } = useBusiness();
  const [logoUrl, setLogoUrl] = useState<string>('');
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));



  useEffect(() => {
    const loadLogo = async () => {
      if (!businessId) {
        setLogoUrl('');
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'users', businessId));
        const data = snap.exists() ? snap.data() : null;

        const url =
          (data as any)?.publicSettings?.logoUrl ||
          (data as any)?.logoUrl ||
          (data as any)?.logo ||
          '';

        setLogoUrl(url);
      } catch (err) {
        console.error('Erro ao carregar logo do business:', err);
        setLogoUrl('');
      }
    };

    loadLogo();
  }, [businessId]);

  const [elements, setElements] = useState<LabelElement[]>(() => (initialTemplate?.elements as LabelElement[]) || []);
  const [name, setName] = useState<string>(() => initialTemplate?.name || '');
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [selectedSize, setSelectedSize] = useState<PresetSize>(() => {
    const w = (initialTemplate as any)?.width;
    const h = (initialTemplate as any)?.height;
    return PRESET_SIZES.find((s) => s.width === w && s.height === h) || PRESET_SIZES[10];
  });

  // Zoom/snap (resolve drift/pulos)
  const [zoom, setZoom] = useState<number>(2.5);
  const [snap, setSnap] = useState<boolean>(true);
  const gridSize = 2;

  const productCode = useMemo(() => {
    const anyP = product as any;
    return (
      String(anyP.gtin || anyP.barcode || anyP.ean || anyP.codigoBarras || anyP.sku || '000000')
    );
  }, [product]);

  /**
   * Vamos capturar o SVG do Barcode para reutilizar na impressão (iframe).
   * Isso evita “print da tela” e mantém o padrão @page + position:absolute.
   */
  const barcodeSvgContainerRef = useRef<HTMLDivElement | null>(null);

  const getBarcodeSvgMarkup = useCallback((): string => {
    const container = barcodeSvgContainerRef.current;
    if (!container) return '';

    const svg = container.querySelector('svg');
    if (!svg) return '';

    // Clona para não mexer no DOM do React
    const cloned = svg.cloneNode(true) as SVGSVGElement;

    // Força dimensão responsiva pro bloco da etiqueta
    cloned.setAttribute('width', '100%');
    cloned.setAttribute('height', '100%');

    // Alguns browsers ignoram width/height sem style em SVG
    (cloned as any).style.width = '100%';
    (cloned as any).style.height = '100%';
    (cloned as any).style.display = 'block';

    return cloned.outerHTML;
  }, []);

  // ===========================
  // IMPRESSÃO (MANTENDO PADRÃO)
  // ===========================
const handlePrint = useCallback(() => {
  setSelectedId(null);

  const canvas = document.getElementById('designer-canvas') as HTMLDivElement | null;
  if (!canvas) {
    alert('Canvas não encontrado para imprimir.');
    return;
  }

  // Canvas em PX (na tela) representando selectedSize em MM
  const canvasPxW = canvas.offsetWidth;
  const canvasPxH = canvas.offsetHeight;

  // Conversão: quantos mm vale 1px
  const mmPerPxX = selectedSize.width / canvasPxW;
  const mmPerPxY = selectedSize.height / canvasPxH;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const pri = iframe.contentWindow;
  if (!pri) {
    iframe.remove();
    return;
  }

  const barcodeSvg = getBarcodeSvgMarkup();
  const fontScale = 1.35;

  const toMM = (px: number, axis: 'x' | 'y') => {
    const mm = px * (axis === 'x' ? mmPerPxX : mmPerPxY);
    return `${mm.toFixed(3)}mm`;
  };

  const elementsHtml = elements
    .map((el) => {
      let content = '';

      if (el.type === 'logo') {
        content = logoUrl
          ? `<img src="${logoUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />`
          : `<div style="font-size: 8px; color: #ccc;">LOGO</div>`;
      }

      if (el.type === 'productName') {
        content = `<div style="font-weight: 800; font-size: ${Math.round(el.fontSize * fontScale)}px; text-transform: uppercase; line-height: 1;">${product.name}</div>`;
      }

      if (el.type === 'price') {
        content = `<div style="font-weight: 900; font-size: ${Math.round(el.fontSize * 1.3)}px; line-height: 1;">${formatCurrency(product.salePrice)}</div>`;
      }

      if (el.type === 'barcode') {
        content = barcodeSvg
          ? `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
               <div style="width:100%; flex:1; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                 ${barcodeSvg}
               </div>
               <div style="font-family: Arial; font-size: 10px; font-weight: bold; line-height: 1; margin-top: 2px;">${productCode}</div>
             </div>`
          : `<div style="text-align:center;">
               <div style="font-family: Arial; font-size: 10px; font-weight: bold; line-height: 1;">${productCode}</div>
               <div style="font-size: 30px; letter-spacing: -2px; margin-top: -5px; line-height: 1;">|||||||||||||||||</div>
             </div>`;
      }

      const rotate = el.rotation ? `transform: rotate(${el.rotation}deg); transform-origin: center;` : '';

      return `
        <div style="
          position: absolute;
          left: ${toMM(el.x, 'x')};
          top: ${toMM(el.y, 'y')};
          width: ${toMM(el.width, 'x')};
          height: ${toMM(el.height, 'y')};
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-family: Arial, sans-serif;
          overflow: hidden;
          ${rotate}
        ">${content}</div>
      `;
    })
    .join('');

  pri.document.open();
  pri.document.write(`
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { size: ${selectedSize.width}mm ${selectedSize.height}mm; margin: 0; }
          html, body { margin: 0; padding: 0; }
          body {
            width: ${selectedSize.width}mm;
            height: ${selectedSize.height}mm;
            position: relative;
            overflow: hidden;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          * { box-sizing: border-box; }
          svg { width: 100% !important; height: auto !important; }

          /* evita “fit” de alguns browsers */
          @media print {
            html, body { width: ${selectedSize.width}mm; height: ${selectedSize.height}mm; }
          }
        </style>
      </head>
      <body>
        ${elementsHtml}
        <script>
          window.onload = function() {
            try {
              window.focus();
              window.print();
            } finally {
              setTimeout(function() {
                if (window.frameElement) window.frameElement.remove();
              }, 800);
            }
          };
        </script>
      </body>
    </html>
  `);
  pri.document.close();
}, [elements, product.name, product.salePrice, productCode, selectedSize, getBarcodeSvgMarkup, logoUrl]);

  // =========
  // ELEMENTOS
  // =========
  const addElement = (type: ElementType) => {
    const id = Date.now().toString();
    setElements((prev) => [...prev, { id, type, x: 10, y: 10, width: 140, height: 40, fontSize: 16 }]);
    setSelectedId(id);
  };

  const handleSave = async () => {
    if (!name?.trim() || !businessId) return alert('Dê um nome ao layout');

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        businessId,
        elements,
        width: selectedSize.width,
        height: selectedSize.height,
        updatedAt: serverTimestamp(),
      };

      if (initialTemplate?.id) {
        await updateDoc(doc(db, 'label_templates', initialTemplate.id), data);
      } else {
        await addDoc(collection(db, 'label_templates'), { ...data, createdAt: serverTimestamp() });
      }

      onSave();
    } catch (e) {
      alert('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  // ====================
  // CONTROLE FINO (TECLADO)
  // ====================
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;

      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as any).isContentEditable)) return;

      const step = e.shiftKey ? 10 : 1;
      const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
      const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
      if (!dx && !dy) return;

      e.preventDefault();
      setElements((prev) => prev.map((el) => (el.id === selectedId ? { ...el, x: el.x + dx, y: el.y + dy } : el)));
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId]);

  const onCanvasMouseDown = () => setSelectedId(null);



  // ===========================
  // CONFIG DO BARCODE (visual)
  // ===========================
  // Ajuste fino do barcode no designer/print
  // - displayValue false pra não duplicar número (a gente exibe o número embaixo)
  // - height/width são “base”; o SVG vai ser escalado pelo container

  const onlyDigits = /^\d+$/.test(productCode);
  const isEAN13 = onlyDigits && (productCode.length === 12 || productCode.length === 13);

  const barcodeFormat = (isEAN13 ? 'EAN13' : 'CODE128') as 'EAN13' | 'CODE128';

  const barcodeProps = useMemo(

    () => ({
      value: productCode,
      format: barcodeFormat,
      displayValue: false,
      margin: 3,
      width: 2,
      height: 70,
      background: '#ffffff',
      lineColor: '#000000',
      renderer: 'svg' as const,
    }),
    [productCode, isEAN13]
  );

  return (
    <div className="flex h-full bg-slate-900 overflow-hidden relative">
      {/* Hidden barcode render (fonte do SVG para impressão) */}
      <div
        ref={barcodeSvgContainerRef}
        style={{
          position: 'absolute',
          left: -99999,
          top: -99999,
          width: 400,
          height: 120,
          overflow: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
        }}
        aria-hidden
      >
        <Barcode {...barcodeProps} />
      </div>

      {/* SIDEBAR */}
      <div className="w-80 bg-white border-r p-6 space-y-6 flex flex-col z-20 shadow-2xl">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
          <Maximize size={20} className="text-blue-600" /> Layout
        </h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do Modelo"
          className="w-full border-2 border-slate-100 p-2 rounded-lg outline-none focus:border-blue-500 font-medium"
        />

        <select
          className="w-full border-2 border-slate-100 rounded-lg p-2 font-bold text-slate-700 bg-slate-50"
          value={selectedSize.name}
          onChange={(e) => {
            const s = PRESET_SIZES.find((x) => x.name === e.target.value);
            if (s) setSelectedSize(s);
          }}
        >
          {PRESET_SIZES.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name} mm
            </option>
          ))}
        </select>

        {/* Zoom + Snap */}
        <div className="space-y-3 rounded-xl border border-slate-100 p-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600 w-12">Zoom</span>
            <input type="range" min={1} max={4} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" />
            <span className="text-xs font-bold text-slate-700 w-14 text-right">{Math.round(zoom * 100)}%</span>
          </div>

          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} />
            Snap (grade)
          </label>

          <div className="text-[11px] text-slate-500 leading-snug">
            Dica: setas movem o elemento selecionado. Segure <b>Shift</b> para mover mais rápido.
          </div>
        </div>

        <div className="space-y-2">
          {/* No grupo de botões de adicionar elementos */}
          <button
            onClick={() => addElement('logo')}
            className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-orange-50 font-bold text-slate-600 text-sm"
          >
            <Image size={18} className="text-orange-500" /> Logotipo
          </button>

          <button
            onClick={() => addElement('productName')}
            className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-blue-50 font-bold text-slate-600 text-sm"
          >
            <Type size={18} className="text-blue-500" /> Nome Produto
          </button>

          <button
            onClick={() => addElement('price')}
            className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-green-50 font-bold text-slate-600 text-sm"
          >
            <DollarSign size={18} className="text-green-500" /> Preço
          </button>

          <button
            onClick={() => addElement('barcode')}
            className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-purple-50 font-bold text-slate-600 text-sm"
          >
            <BarcodeIcon size={18} className="text-purple-500" /> Código
          </button>
        </div>

        <div className="mt-auto space-y-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {saving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />} SALVAR
          </button>

          <button
            onClick={handlePrint}
            className="w-full bg-slate-800 text-white py-4 rounded-xl font-black shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
          >
            <Printer size={20} /> IMPRIMIR
          </button>

          <button onClick={onClose} className="w-full bg-slate-100 text-slate-500 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all">
            Cancelar
          </button>
        </div>
      </div>

      {/* CANVAS AREA */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-20 bg-slate-800 relative" onMouseDown={onCanvasMouseDown}>
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}
        />

        {/* Wrapper do zoom */}
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }} onMouseDown={(e) => e.stopPropagation()}>
          {/* Canvas REAL */}
          <div id="designer-canvas" className="bg-white shadow-[0_0_50px_rgba(0,0,0,0.3)] relative" style={{ width: `${selectedSize.width}mm`, height: `${selectedSize.height}mm` }}>
            {elements.map((el) => (
              <Rnd
                key={el.id}
                size={{ width: el.width, height: el.height }}
                position={{ x: el.x, y: el.y }}
                bounds="parent"
                scale={zoom}
                dragGrid={snap ? [gridSize, gridSize] : undefined}
                resizeGrid={snap ? [gridSize, gridSize] : undefined}
                onDragStart={() => setSelectedId(el.id)}
                onResizeStart={() => setSelectedId(el.id)}
                onDragStop={(_, d) => {
                  setElements((prev) => prev.map((item) => (item.id === el.id ? { ...item, x: d.x, y: d.y } : item)));
                }}
                onResizeStop={(_, __, ref, ___, pos) => {
                  const newW = ref.offsetWidth;
                  const newH = ref.offsetHeight;

                  setElements((prev) =>
                    prev.map((item) => {
                      if (item.id !== el.id) return item;

                      // escala de resize
                      const sx = item.width ? newW / item.width : 1;
                      const sy = item.height ? newH / item.height : 1;

                      // para texto, use a menor escala (evita estourar)
                      const s = Math.min(sx, sy);

                      const isText = item.type === 'productName' || item.type === 'price';

                      return {
                        ...item,
                        width: newW,
                        height: newH,
                        x: pos.x,
                        y: pos.y,
                        fontSize: isText ? clamp(item.fontSize * s, 6, 220) : item.fontSize,
                      };
                    })
                  );
                }}
                // ✅ PROBLEMA 1 (X não funciona): o RND trata o clique como drag.
                // Solução: "cancel" desativa o drag quando o alvo tem essa classe.
                cancel=".label-designer__no-drag"
                onMouseDown={(e: any) => {
                  e.stopPropagation();
                  setSelectedId(el.id);
                }}
                className={`flex items-center justify-center border-2 ${selectedId === el.id ? 'border-blue-500 z-10' : 'border-transparent hover:border-slate-200'
                  }`}
              >
                {/* Conteúdo do elemento */}
                <div className="w-full h-full flex items-center justify-center overflow-hidden select-none">

                  {el.type === 'logo' && (
                    <div className="w-full h-full flex items-center justify-center p-1">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain pointer-events-none" />
                      ) : (
                        <div className="text-[10px] text-slate-400 font-bold italic border border-dashed border-slate-300 p-2">
                          Logo não configurada
                        </div>
                      )}
                    </div>
                  )}
                  {el.type === 'productName' && (
                    <div className="font-bold text-center leading-[1] px-1 uppercase text-slate-900" style={{ fontSize: el.fontSize }}>
                      {product.name}
                    </div>
                  )}

                  {el.type === 'price' && (
                    <div className="font-black text-center text-slate-900" style={{ fontSize: el.fontSize * 1.2 }}>
                      {formatCurrency(product.salePrice)}
                    </div>
                  )}

                  {/* ✅ PROBLEMA 2 (barcode só números): agora renderiza o SVG do react-barcode */}
                  {el.type === 'barcode' && (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="w-full flex-1 flex items-center justify-center overflow-hidden px-1">
                        <Barcode
                          {...barcodeProps}
                        // Ajuste de escala visual no canvas: o SVG é responsivo, mas a lib usa valores base.
                        // O container manda.
                        />
                      </div>
                      <div className="text-[10px] font-bold leading-none mt-1">{productCode}</div>
                    </div>
                  )}
                </div>

                {/* Botão excluir */}
                {selectedId === el.id && (
                  <button
                    type="button"
                    className="label-designer__no-drag absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-xl hover:bg-red-600 transition-colors"
                    title="Remover"
                    onMouseDown={(e) => {
                      // evita iniciar drag/resize
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setElements((prev) => prev.filter((i) => i.id !== el.id));
                      setSelectedId((curr) => (curr === el.id ? null : curr));
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </Rnd>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};