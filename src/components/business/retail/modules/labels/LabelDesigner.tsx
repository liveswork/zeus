import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import Barcode from 'react-barcode';
import { 
    Type, Image as ImageIcon, Barcode as BarcodeIcon, 
    DollarSign, Printer, Save, Trash2, RotateCw, X
} from 'lucide-react';
import { formatCurrency } from '../../../../../utils/formatters';
import { Product } from '../../../../../types'; // Importe seu tipo Product

// --- TIPOS ---
type ElementType = 'text' | 'price' | 'barcode' | 'image';

interface LabelElement {
    id: string;
    type: ElementType;
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    fontSize?: number;
    fontWeight?: string;
}

interface LabelSize {
    width: number;
    height: number;
    name: string;
}

const PRESET_SIZES: LabelSize[] = [
    { width: 80, height: 50, name: '80mm x 50mm' },
    { width: 80, height: 40, name: '80mm x 40mm' },
    { width: 80, height: 30, name: '80mm x 30mm' },
    { width: 50, height: 30, name: '50mm x 30mm' },
    { width: 30, height: 20, name: '30mm x 20mm' },
];

const MM_TO_PX = 3.78; 
const ZOOM_FACTOR = 1.5; 

// --- PROPS DO COMPONENTE ---
interface LabelDesignerProps {
    product: Product; // Recebe o produto real
    onClose: () => void; // Função para fechar o editor
}

export const LabelDesigner: React.FC<LabelDesignerProps> = ({ product, onClose }) => {
    const [selectedSize, setSelectedSize] = useState<LabelSize>(PRESET_SIZES[1]);
    const [elements, setElements] = useState<LabelElement[]>([]);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

    // --- AÇÕES ---

    const addElement = (type: ElementType) => {
        const id = Date.now().toString();
        let newElement: LabelElement = {
            id,
            type,
            x: 10,
            y: 10,
            width: 100,
            height: 30,
            rotation: 0,
            content: '',
            fontSize: 12,
            fontWeight: 'normal'
        };

        // PREENCHIMENTO AUTOMÁTICO COM DADOS DO PRODUTO
        switch (type) {
            case 'text':
                newElement.content = product.name; // Puxa o nome real
                newElement.width = 200;
                newElement.height = 40;
                newElement.fontSize = 14;
                newElement.fontWeight = 'bold';
                break;
            case 'price':
                newElement.content = formatCurrency(product.salePrice); // Puxa o preço real
                newElement.fontSize = 24;
                newElement.fontWeight = 'bold';
                newElement.width = 120;
                newElement.height = 40;
                break;
            case 'barcode':
                newElement.content = product.gtin || product.sku || '000000000000'; // Prioriza EAN, depois SKU
                newElement.width = 150;
                newElement.height = 50;
                break;
            case 'image':
                newElement.content = product.imageUrl || 'https://via.placeholder.com/100'; // Puxa logo/imagem do produto
                newElement.width = 50;
                newElement.height = 50;
                break;
        }

        setElements([...elements, newElement]);
        setSelectedElementId(id);
    };

    const updateElement = (id: string, changes: Partial<LabelElement>) => {
        setElements(prev => prev.map(el => el.id === id ? { ...el, ...changes } : el));
    };

    const rotateElement = (id: string) => {
        const el = elements.find(e => e.id === id);
        if (el) {
            const newRotation = (el.rotation + 90) % 360;
            updateElement(id, { rotation: newRotation });
        }
    };

    const deleteElement = (id: string) => {
        setElements(prev => prev.filter(el => el.id !== id));
        setSelectedElementId(null);
    };

    const handlePrint = () => {
        window.print();
    };

    // --- RENDERIZAÇÃO ---
    const renderElementContent = (el: LabelElement) => {
        const style = {
            transform: `rotate(${el.rotation}deg)`,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${el.fontSize}px`,
            fontWeight: el.fontWeight,
            textAlign: 'center' as const,
            overflow: 'hidden',
            whiteSpace: 'nowrap' as const
        };

        switch (el.type) {
            case 'barcode':
                return (
                    <div style={style}>
                        <Barcode 
                            value={el.content} 
                            width={1.5} 
                            height={40} 
                            fontSize={12} 
                            displayValue={true} 
                            margin={0}
                        />
                    </div>
                );
            case 'image':
                return <img src={el.content} style={{...style, objectFit: 'contain'}} alt="Img" />;
            default:
                return <div style={style}>{el.content}</div>;
        }
    };

    return (
        <div className="flex flex-col h-[85vh] bg-gray-100">
            {/* Toolbar */}
            <div className="bg-white border-b p-4 flex justify-between items-center print:hidden">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-500">Tamanho</label>
                        <select 
                            className="border rounded p-1 text-sm bg-gray-50"
                            onChange={(e) => {
                                const size = PRESET_SIZES.find(s => s.name === e.target.value);
                                if (size) setSelectedSize(size);
                            }}
                            value={selectedSize.name}
                        >
                            {PRESET_SIZES.map(size => (
                                <option key={size.name} value={size.name}>{size.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="h-8 w-px bg-gray-300 mx-2"></div>

                    <button onClick={() => addElement('text')} className="p-2 hover:bg-blue-50 rounded flex flex-col items-center text-xs text-gray-600">
                        <Type size={18} /> Texto
                    </button>
                    <button onClick={() => addElement('price')} className="p-2 hover:bg-green-50 rounded flex flex-col items-center text-xs text-gray-600">
                        <DollarSign size={18} /> Preço
                    </button>
                    <button onClick={() => addElement('barcode')} className="p-2 hover:bg-purple-50 rounded flex flex-col items-center text-xs text-gray-600">
                        <BarcodeIcon size={18} /> EAN
                    </button>
                    <button onClick={() => addElement('image')} className="p-2 hover:bg-orange-50 rounded flex flex-col items-center text-xs text-gray-600">
                        <ImageIcon size={18} /> Logo
                    </button>
                </div>

                <div className="flex gap-2">
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">
                        <Printer size={18} /> Imprimir
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-10 bg-gray-200 print:p-0 print:block print:bg-white">
                <div 
                    id="label-area"
                    className="bg-white shadow-2xl relative print:shadow-none print:absolute print:top-0 print:left-0"
                    style={{
                        width: `${selectedSize.width * MM_TO_PX * ZOOM_FACTOR}px`,
                        height: `${selectedSize.height * MM_TO_PX * ZOOM_FACTOR}px`,
                    }}
                    onClick={() => setSelectedElementId(null)}
                >
                    {/* Grid Visual */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none print:hidden" 
                         style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                    </div>

                    {elements.map(el => (
                        <Rnd
                            key={el.id}
                            size={{ width: el.width, height: el.height }}
                            position={{ x: el.x, y: el.y }}
                            onDragStop={(e, d) => { updateElement(el.id, { x: d.x, y: d.y }); setSelectedElementId(el.id); }}
                            onResizeStop={(e, direction, ref, delta, position) => {
                                updateElement(el.id, {
                                    width: parseInt(ref.style.width),
                                    height: parseInt(ref.style.height),
                                    ...position,
                                });
                            }}
                            onMouseDown={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                            className={`group ${selectedElementId === el.id ? 'border-2 border-blue-500 z-10' : 'border border-transparent hover:border-gray-300'} print:border-none`}
                            bounds="parent"
                        >
                            {renderElementContent(el)}
                            
                            {selectedElementId === el.id && (
                                <div className="absolute -top-10 left-0 flex gap-1 bg-white shadow rounded border p-1 print:hidden z-20">
                                    <button onClick={() => rotateElement(el.id)} className="p-1 hover:bg-gray-100 rounded"><RotateCw size={14}/></button>
                                    {(el.type === 'text' || el.type === 'price') && (
                                        <>
                                            <button onClick={() => updateElement(el.id, { fontSize: (el.fontSize || 12) + 2 })} className="p-1 font-bold text-xs">A+</button>
                                            <button onClick={() => updateElement(el.id, { fontSize: (el.fontSize || 12) - 2 })} className="p-1 font-bold text-xs">A-</button>
                                        </>
                                    )}
                                    <button onClick={() => deleteElement(el.id)} className="p-1 hover:bg-red-100 text-red-500 rounded"><Trash2 size={14}/></button>
                                </div>
                            )}
                        </Rnd>
                    ))}
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: ${selectedSize.width}mm ${selectedSize.height}mm; margin: 0; }
                    body * { visibility: hidden; }
                    #label-area, #label-area * { visibility: visible; }
                    #label-area {
                        position: fixed; left: 0; top: 0;
                        width: ${selectedSize.width}mm !important;
                        height: ${selectedSize.height}mm !important;
                        transform: none !important;
                        box-shadow: none !important;
                    }
                    .react-draggable { border: none !important; }
                }
            `}</style>
        </div>
    );
};