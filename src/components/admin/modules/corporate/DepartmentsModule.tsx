import React, { useState } from 'react';
import { Plus, Trash2, Users, DollarSign } from 'lucide-react';
import { Modal } from '../../../ui/Modal';
import { FormField } from '../../../ui/FormField';

// Tipagem
interface Department {
    id: string;
    name: string;
    manager: string; // Email do gestor
    budget: number; // Orçamento mensal
    headcount: number; // Qtd pessoas
}

export const DepartmentsModule: React.FC = () => {
    // Mock Data - Depois ligamos no Firebase
    const [departments, setDepartments] = useState<Department[]>([
        { id: '1', name: 'Comercial & Vendas', manager: 'diretor.vendas@nexus.com', budget: 50000, headcount: 12 },
        { id: '2', name: 'Engenharia & Produto', manager: 'cto@nexus.com', budget: 120000, headcount: 8 },
        { id: '3', name: 'Customer Success (CS)', manager: 'head.cs@nexus.com', budget: 30000, headcount: 5 },
    ]);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDept, setNewDept] = useState({ name: '', manager: '', budget: 0 });

    const handleSave = () => {
        setDepartments([...departments, { id: Date.now().toString(), ...newDept, headcount: 0 }]);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Departamentos</h2>
                    <p className="text-gray-500">Estrutura organizacional e centros de custo.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700">
                    <Plus size={20} /> Novo Departamento
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map(dept => (
                    <div key={dept.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-800">{dept.name}</h3>
                            <button className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <div className="bg-blue-100 p-1.5 rounded text-blue-600"><Users size={16} /></div>
                                <span>{dept.headcount} Colaboradores</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <div className="bg-green-100 p-1.5 rounded text-green-600"><DollarSign size={16} /></div>
                                <span>Orçamento: R$ {dept.budget.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                            Gestor: <span className="font-medium text-gray-700">{dept.manager || 'Não definido'}</span>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Criar Departamento">
                <div className="p-6 space-y-4">
                    <FormField label="Nome do Departamento">
                        <input className="w-full border p-2 rounded" value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} placeholder="Ex: Marketing" />
                    </FormField>
                    <FormField label="Email do Gestor (Líder)">
                        <input className="w-full border p-2 rounded" value={newDept.manager} onChange={e => setNewDept({...newDept, manager: e.target.value})} placeholder="gestor@empresa.com" />
                    </FormField>
                    <FormField label="Orçamento Mensal (R$)">
                        <input type="number" className="w-full border p-2 rounded" value={newDept.budget} onChange={e => setNewDept({...newDept, budget: Number(e.target.value)})} />
                    </FormField>
                    <div className="flex justify-end pt-4">
                        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">Salvar</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};