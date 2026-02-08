import React from 'react';
import { Order } from '../../../types';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';

interface KitchenPrintProps {
  order: Order;
  format?: 'a4' | '80mm' | '58mm';
}

export const KitchenPrint: React.FC<KitchenPrintProps> = ({ order, format = '80mm' }) => {
  const date = formatDateTime(order.createdAt || new Date());

  // Função para detectar se é pizza meio-a-meio
  const isHalfPizza = (itemName: string) => {
    return itemName.includes('½') || 
           itemName.includes('/') || 
           itemName.toLowerCase().includes('meio') ||
           itemName.toLowerCase().includes('meia');
  };

  // Separar itens: meio-a-meio primeiro, depois os demais
  const groupedItems = order.items.reduce((acc, item) => {
    if (isHalfPizza(item.name)) {
      acc.halfPizzas.push(item);
    } else {
      acc.otherItems.push(item);
    }
    return acc;
  }, { halfPizzas: [] as typeof order.items, otherItems: [] as typeof order.items });

  return (
    <div className={`print-container bg-white text-black font-sans print-${format}`}>
      <style type="text/css" media="print">
        {`
          @page { 
            size: ${format === 'a4' ? 'A4' : '80mm auto'}; 
            margin: ${format === 'a4' ? '1cm' : '0.3cm'}; 
          }
          body { -webkit-print-color-adjust: exact; }
          .print-container { margin: 0; padding: 0; }
          .print-a4 { 
            font-size: 16pt; 
            width: 100%;
          }
          .print-80mm { 
            font-family: Arial, sans-serif; 
            width: 76mm; 
            font-size: 11pt; 
            line-height: 1.2;
          }
          .print-58mm { 
            font-family: Arial, sans-serif; 
            width: 56mm; 
            font-size: 13pt; 
            line-height: 1.2;
          }
          .no-break { page-break-inside: avoid; break-inside: avoid; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          .font-extrabold { font-weight: 800; }
          .border-dashed { border-style: dashed; }
          .border-solid { border-style: solid; }
          .mt-4 { margin-top: 1rem; }
          .mb-3 { margin-bottom: 0.75rem; }
          .mb-4 { margin-bottom: 1rem; }
          .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
          .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
          .bg-highlight { background-color: #f0f0f0; }
          .text-large { font-size: 1.1em; }
          .text-xlarge { font-size: 1.3em; }
          .item-highlight { background-color: #ffffcc; }
          .half-pizza-highlight { 
            background-color: #e6f7ff; 
            border: 3px solid #1890ff;
            position: relative;
          }
          .half-pizza-badge {
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            background: #1890ff;
            color: white;
            padding: 2px 12px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 0.9em;
          }
          .section-header {
            background: linear-gradient(45deg, #1890ff, #096dd9);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            text-align: center;
            margin: 10px 0;
            font-weight: bold;
          }
          .urgent { background-color: #ffcccc; border: 2px solid #ff0000; }
          .pizza-sides {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin-top: 4px;
          }
          .pizza-side {
            flex: 1;
            text-align: center;
            padding: 4px;
            background: #f8f9fa;
            border-radius: 4px;
            border: 1px dashed #ccc;
          }
          .section-divider {
            border: 2px dashed #999;
            margin: 15px 0;
          }
        `}
      </style>

      {/* Cabeçalho Destaque */}
      <div className="header text-center mb-4 no-break bg-highlight py-2">
        <h1 className="text-xlarge font-extrabold mb-1">🚨 PEDIDO - COZINHA 🚨</h1>
        <div className="flex justify-between px-2">
          <span className="font-bold text-large">Mesa: {order.tableName}</span>
          <span className="font-bold text-large">Nº: {order.orderNumber || order.id?.slice(-4)}</span>
        </div>
        <p className="font-bold mt-1">{date}</p>
      </div>

      {/* Linha de separação */}
      <div className="border-solid border-b-4 border-black mb-3"></div>

      {/* SEÇÃO: PIZZAS MEIO-A-MEIO */}
      {groupedItems.halfPizzas.length > 0 && (
        <div className="half-pizzas-section no-break">
          <div className="section-header">
            🍕 PIZZAS MEIO-A-MEIO ({groupedItems.halfPizzas.length})
          </div>
          
          {groupedItems.halfPizzas.map((item, index) => (
            <div 
              key={`half-${index}`} 
              className="item-block no-break mb-3 p-2 rounded half-pizza-highlight"
            >
              {/* Badge para meio-a-meio */}
              <div className="half-pizza-badge">
                🍕 MEIO-A-MEIO
              </div>

              {/* Quantidade e Nome em destaque */}
              <div className="flex justify-between items-center py-2 mt-2">
                <span className="font-extrabold text-xlarge bg-white px-3 py-1 rounded-lg border-2 border-black">
                  {item.qty}x
                </span>
                <span className="font-extrabold text-large text-center flex-grow mx-2">
                  PIZZA MEIO-A-MEIO
                </span>
              </div>

              {/* Detalhes das metades */}
              <div className="mt-3 p-2 bg-blue-50 border-2 border-blue-300 rounded">
                <p className="font-bold text-center text-blue-800 mb-2">🍕 METADES:</p>
                <div className="pizza-sides">
                  {item.name.split('/').map((side, sideIndex) => (
                    <div key={sideIndex} className="pizza-side">
                      <span className="font-bold text-sm">
                        {side.trim().replace('½', '').replace('½ ', '')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observações */}
              {item.observation && (
                <div className="mt-2 p-2 bg-white border-2 border-dashed border-gray-600 rounded">
                  <p className="font-bold text-sm mb-1">📝 OBSERVAÇÃO:</p>
                  <p className="font-bold text-red-600">{item.observation}</p>
                </div>
              )}

              {/* Adicionais */}
              {item.additions && item.additions.length > 0 && (
                <div className="mt-2 p-2 bg-green-50 border border-green-400 rounded">
                  <p className="font-bold text-sm mb-1">➕ ADICIONAIS:</p>
                  {item.additions.map((addition: { name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | Iterable<React.ReactNode> | null | undefined; }, addIndex: React.Key | null | undefined) => (
                    <p key={addIndex} className="font-bold">• {addition.name}</p>
                  ))}
                </div>
              )}

              {/* Remoções */}
              {item.removals && item.removals.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-400 rounded">
                  <p className="font-bold text-sm mb-1">➖ REMOVER:</p>
                  {item.removals.map((removal: { name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | Iterable<React.ReactNode> | null | undefined; }, remIndex: React.Key | null | undefined) => (
                    <p key={remIndex} className="font-bold">• {removal.name}</p>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Divisor entre seções */}
          <div className="section-divider"></div>
        </div>
      )}

      {/* SEÇÃO: OUTROS ITENS */}
      {groupedItems.otherItems.length > 0 && (
        <div className="other-items-section no-break">
          {groupedItems.otherItems.length > 0 && (
            <div className="section-header" style={{ background: 'linear-gradient(45deg, #52c41a, #389e0d)' }}>
              📦 OUTROS ITENS ({groupedItems.otherItems.length})
            </div>
          )}
          
          {groupedItems.otherItems.map((item, index) => (
            <div 
              key={`other-${index}`} 
              className={`item-block no-break mb-3 p-2 rounded ${
                item.urgent ? 'urgent' : 'item-highlight'
              }`}
            >
              {/* Quantidade e Nome em destaque */}
              <div className="flex justify-between items-center py-2">
                <span className="font-extrabold text-xlarge bg-white px-3 py-1 rounded-lg border-2 border-black">
                  {item.qty}x
                </span>
                <span className="font-extrabold text-large text-center flex-grow mx-2">
                  {item.name.toUpperCase()}
                </span>
              </div>

              {/* Observações */}
              {item.observation && (
                <div className="mt-2 p-2 bg-white border-2 border-dashed border-gray-600 rounded">
                  <p className="font-bold text-sm mb-1">📝 OBSERVAÇÃO:</p>
                  <p className="font-bold text-red-600">{item.observation}</p>
                </div>
              )}

              {/* Adicionais */}
              {item.additions && item.additions.length > 0 && (
                <div className="mt-2 p-2 bg-green-50 border border-green-400 rounded">
                  <p className="font-bold text-sm mb-1">➕ ADICIONAIS:</p>
                  {item.additions.map((addition: { name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | Iterable<React.ReactNode> | null | undefined; }, addIndex: React.Key | null | undefined) => (
                    <p key={addIndex} className="font-bold">• {addition.name}</p>
                  ))}
                </div>
              )}

              {/* Remoções */}
              {item.removals && item.removals.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-400 rounded">
                  <p className="font-bold text-sm mb-1">➖ REMOVER:</p>
                  {item.removals.map((removal: { name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | Iterable<React.ReactNode> | null | undefined; }, remIndex: React.Key | null | undefined) => (
                    <p key={remIndex} className="font-bold">• {removal.name}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rodapé */}
      <div className="footer text-center mt-4 no-break">
        <div className="border-solid border-b-4 border-black mb-3"></div>
        <div className="bg-highlight py-2 rounded">
          <p className="font-extrabold text-xlarge">
            TOTAL DE ITENS: {order.items.reduce((sum, item) => sum + item.qty, 0)}
          </p>
          {order.delivery && (
            <p className="font-bold text-large mt-2 bg-yellow-300 py-1 rounded">
              🛵 ENTREGA / DELIVERY
            </p>
          )}
          <p className="font-bold text-large mt-3">*** COZINHA ***</p>
          <p className="text-sm mt-2 font-bold">
            Impresso em: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};