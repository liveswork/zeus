import React, { useState, useMemo } from 'react';
import { ArrowRight, Check, MapPin } from 'lucide-react';

interface DataMapperProps {
    analysis: any;
    onComplete: (mappings: any) => void;
}

export const DataMapper: React.FC<DataMapperProps> = ({ analysis, onComplete }) => {
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
    const [valueMapping, setValueMapping] = useState<Record<string, string>>({});

    const targetFields = [
        { value: 'customer_name', label: 'Cliente: Nome' },
        { value: 'customer_phone', label: 'Cliente: Telefone' },
        { value: 'customer_email', label: 'Cliente: Email' },
        { value: 'address_street', label: 'Cliente: Endereço (Rua)' },
        { value: 'address_number', label: 'Cliente: Endereço (Número)' },
        { value: 'address_neighborhood', label: 'Cliente: Endereço (Bairro)' },
        { value: 'customer_notes', label: 'Cliente: Observações' },
        { value: 'delivery_fee_name', label: 'Taxa de Entrega: Bairro' },
        { value: 'delivery_fee_price', label: 'Taxa de Entrega: Preço' },
    ];

    const handleColumnMapChange = (source: string, target: string) => {
        setColumnMapping(prev => ({...prev, [source]: target }));
    };

    const handleValueMapChange = (source: string, target: string) => {
        setValueMapping(prev => ({...prev, [source]: target || source }));
    };

    const handleComplete = () => {
        onComplete({
            columnMapping,
            valueMapping
        });
    };

    return (
        <div className="space-y-8">
            {Object.keys(columnMapping).map(fileName => (
                <div key={fileName}>
                    <h3 className="text-xl font-semibold mb-2">Mapeamento para: <span className="font-mono text-purple-700">{fileName}</span></h3>
                    <div className="space-y-2">
                        {parsedData[fileName].headers.map(header => (
                            <ColumnMappingRow key={header} sourceField={header} suggestedTarget={columnMapping[header] || ''} targetOptions={targetFields} onMapChange={handleColumnMapChange} />
                        ))}
                    </div>
                </div>
            ))}
            
            {uniqueValues.bairros && (
                <div className="mt-6 border-t pt-6">
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><MapPin/> Mapeamento de Bairros</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                        {uniqueNeighborhoods.map((value: string) => (
                            <ValueMappingRow key={value} sourceValue={value} onMapChange={handleValueMapChange} />
                        ))}
                    </div>
                </div>
            )}
            
            <div className="flex justify-end pt-4">
                <button onClick={() => onComplete({columnMapping, valueMapping})} className="...">
                    <Check size={20} /> Executar Migração
                </button>
            </div>
        </div>
    );
};
