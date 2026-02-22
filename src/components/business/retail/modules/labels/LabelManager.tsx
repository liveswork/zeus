// src/components/business/retail/modules/labels/LabelManager.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../../config/firebase';
import { useBusiness } from '../../../../../contexts/BusinessContext';
import { LabelDesigner } from './LabelDesigner';
import { Plus, Layout, Loader } from 'lucide-react';
import type { Product, LabelTemplate } from '../../../../../types';
import { formatCurrency } from '../../../../../utils/formatters';
import Barcode from 'react-barcode';

// Se o seu LabelElement já é exportado de types, pode importar e remover esse type local.
// Mantive local só para o TS daqui entender o shape do elements ao imprimir.
type ElementType = 'productName' | 'price' | 'barcode';

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

export const LabelManager: React.FC<{ product: Product; onClose: () => void }> = ({ product, onClose }) => {
  const { businessId } = useBusiness();

  // ✅ Agora usando o tipo real
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'select' | 'edit'>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate | null>(null);

  // ===== Barcode SVG (para impressão 1 clique) =====
  const productCode = useMemo(() => product.gtin || product.sku || '000000', [product.gtin, product.sku]);

  const barcodeSvgContainerRef = useRef<HTMLDivElement | null>(null);

  const barcodeProps = useMemo(
    () => ({
      value: productCode,
      format: 'CODE128' as const,
      displayValue: false,
      margin: 0,
      width: 2,
      height: 60,
      background: '#ffffff',
      lineColor: '#000000',
      renderer: 'svg' as const,
    }),
    [productCode]
  );

  const getBarcodeSvgMarkup = useCallback((): string => {
    const container = barcodeSvgContainerRef.current;
    if (!container) return '';
    const svg = container.querySelector('svg');
    if (!svg) return '';

    const cloned = svg.cloneNode(true) as SVGSVGElement;
    cloned.setAttribute('width', '100%');
    cloned.setAttribute('height', '100%');
    (cloned as any).style.width = '100%';
    (cloned as any).style.height = '100%';
    (cloned as any).style.display = 'block';
    return cloned.outerHTML;
  }, []);

  // ===== Load templates =====
  const loadTemplates = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'label_templates'), where('businessId', '==', businessId));
      const snap = await getDocs(q);

      // ✅ Tipando como LabelTemplate
      // IMPORTANTE: isso pressupõe que no Firestore existem businessId e createdAt.
      // (Pelo seu LabelDesigner, você salva businessId e createdAt, então ok.)
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as LabelTemplate[];

      setTemplates(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) loadTemplates();
  }, [businessId]);

  // ===== Impressão 1 clique =====
  const printTemplate = useCallback(
    (tpl: LabelTemplate) => {
      const barcodeSvg = getBarcodeSvgMarkup();

      // elements do template (garante array)
      const elements = (tpl.elements || []) as unknown as LabelElement[];

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

      const elementsHtml = elements
        .map((el) => {
          let content = '';

          if (el.type === 'productName') {
            content = `<div style="font-weight: 800; font-size: ${el.fontSize}px; text-transform: uppercase; line-height: 1;">${product.name}</div>`;
          }

          if (el.type === 'price') {
            content = `<div style="font-weight: 900; font-size: ${Math.round(el.fontSize * 1.3)}px; line-height: 1;">${formatCurrency(
              product.salePrice
            )}</div>`;
          }

          if (el.type === 'barcode') {
            const barcodeBody = barcodeSvg
              ? `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                   <div style="width:100%; flex: 1; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                     ${barcodeSvg}
                   </div>
                   <div style="font-family: Arial; font-size: 10px; font-weight: bold; line-height: 1; margin-top: 2px;">${productCode}</div>
                 </div>`
              : `<div style="text-align: center;">
                   <div style="font-family: Arial; font-size: 10px; font-weight: bold; line-height: 1;">${productCode}</div>
                   <div style="font-size: 30px; letter-spacing: -2px; margin-top: -5px; line-height: 1;">|||||||||||||||||</div>
                 </div>`;
            content = barcodeBody;
          }

          const rotate = el.rotation ? `transform: rotate(${el.rotation}deg);` : '';

          return `
            <div style="
              position: absolute;
              left: ${el.x}px;
              top: ${el.y}px;
              width: ${el.width}px;
              height: ${el.height}px;
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
              @page { size: ${tpl.width}mm ${tpl.height}mm; margin: 0; }
              html, body { margin: 0; padding: 0; }
              body {
                width: ${tpl.width}mm;
                height: ${tpl.height}mm;
                position: relative;
                overflow: hidden;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              * { box-sizing: border-box; }
              svg { width: 100% !important; height: 100% !important; }
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
    },
    [getBarcodeSvgMarkup, product.name, product.salePrice, productCode]
  );

  // garante que o barcode oculto já renderizou antes de imprimir
  const [printJob, setPrintJob] = useState<LabelTemplate | null>(null);

  useEffect(() => {
    if (!printJob) return;

    const raf = requestAnimationFrame(() => {
      try {
        printTemplate(printJob);
      } finally {
        setPrintJob(null);
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [printJob, printTemplate]);

  if (view === 'edit') {
    return (
      <LabelDesigner
        product={product}
        initialTemplate={selectedTemplate}
        onSave={() => {
          setView('select');
          loadTemplates();
        }}
        onClose={() => setView('select')}
      />
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-[550px] rounded-xl relative">
      {/* Fonte do SVG do barcode para impressão 1 clique */}
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

      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Modelos de Etiqueta</h2>
          <p className="text-slate-500 font-medium italic">Selecione o layout para imprimir</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setView('edit');
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-all"
          >
            <Plus size={20} className="mr-2 inline" /> NOVO LAYOUT
          </button>

          <button
            onClick={onClose}
            className="bg-white text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 border border-slate-200 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="animate-spin text-blue-600" size={40} />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-600">
          Nenhum modelo encontrado. Clique em <b>NOVO LAYOUT</b> para criar o primeiro.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white border-2 border-slate-100 rounded-2xl p-5 hover:border-blue-400 transition-all shadow-sm group">
              <div className="flex justify-between items-start mb-4">
                <Layout size={24} className="text-blue-500" />
                <span className="text-sm font-bold text-slate-700">
                  {tpl.width}mm x {tpl.height}mm
                </span>
              </div>

              <h3 className="font-black text-slate-800 text-lg mb-6">{tpl.name}</h3>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedTemplate(tpl);
                    setView('edit');
                  }}
                  className="flex-1 bg-slate-50 text-slate-600 py-3 rounded-xl text-xs font-bold hover:bg-slate-100 border border-slate-100"
                >
                  EDITAR
                </button>

                {/* ✅ 1 clique: imprime direto */}
                <button
                  onClick={() => setPrintJob(tpl)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md disabled:opacity-70"
                  disabled={!!printJob}
                  title="Imprimir agora"
                >
                  {printJob?.id === tpl.id ? 'IMPRIMINDO...' : 'IMPRIMIR'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};