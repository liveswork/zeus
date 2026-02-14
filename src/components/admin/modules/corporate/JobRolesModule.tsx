import React, { useState } from 'react';
import { Plus, FileText, CheckCircle } from 'lucide-react';
import { Modal } from '../../../ui/Modal';
import { FormField } from '../../../ui/FormField';

export const JobRolesModule: React.FC = () => {
    const [roles, setRoles] = useState([
        { 
            id: '1', 
            title: 'SDR (Pré-vendas)', 
            level: 'Júnior', 
            baseSalary: 2500, 
            dept: 'Comercial & Vendas',
            requirements: ['Boa dicção', 'Resiliência', 'Ensino Médio'],
            responsibilities: ['Prospecção ativa', 'Agendamento de reuniões']
        },
        { 
            id: '2', 
            title: 'Engenheiro de Software Fullstack', 
            level: 'Pleno', 
            baseSalary: 8000, 
            dept: 'Engenharia & Produto',
            requirements: ['React', 'Node.js', 'Firebase', '3 anos exp'],
            responsibilities: ['Desenvolver novas features', 'Code review']
        }
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<any>({ title: '', level: 'Júnior', baseSalary: 0, dept: '', requirements: '', responsibilities: '' });

    const handleSave = () => {
        const newRole = {
            id: Date.now().toString(),
            ...formData,
            requirements: formData.requirements.split(',').map((s: string) => s.trim()),
            responsibilities: formData.responsibilities.split(',').map((s: string) => s.trim())
        };
        setRoles([...roles, newRole]);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Cargos e Salários</h2>
                    <p className="text-gray-500">Definição de funções, níveis e faixas salariais.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700">
                    <Plus size={20} /> Novo Cargo
                </button>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-sm font-bold uppercase">
                        <tr>
                            <th className="p-4">Cargo / Função</th>
                            <th className="p-4">Nível</th>
                            <th className="p-4">Departamento</th>
                            <th className="p-4">Salário Base</th>
                            <th className="p-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map(role => (
                            <tr key={role.id} className="border-t hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-gray-800">{role.title}</div>
                                    <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">{role.responsibilities.join(', ')}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        role.level === 'Sênior' ? 'bg-purple-100 text-purple-700' :
                                        role.level === 'Pleno' ? 'bg-blue-100 text-blue-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                        {role.level}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-600">{role.dept}</td>
                                <td className="p-4 font-mono text-gray-700">R$ {role.baseSalary.toLocaleString()}</td>
                                <td className="p-4 text-center">
                                    <button className="text-blue-600 font-bold text-sm hover:underline">Editar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cadastrar Novo Cargo" maxWidth="max-w-2xl">
                <div className="p-6 grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <FormField label="Título do Cargo">
                            <input className="w-full border p-2 rounded" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Analista de Marketing" />
                        </FormField>
                    </div>
                    <FormField label="Nível Senioridade">
                        <select className="w-full border p-2 rounded" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}>
                            <option>Estagiário</option>
                            <option>Júnior</option>
                            <option>Pleno</option>
                            <option>Sênior</option>
                            <option>Lead / Gerente</option>
                            <option>C-Level (Diretoria)</option>
                        </select>
                    </FormField>
                    <FormField label="Departamento">
                        <select className="w-full border p-2 rounded" value={formData.dept} onChange={e => setFormData({...formData, dept: e.target.value})}>
                            <option value="">Selecione...</option>
                            <option>Comercial & Vendas</option>
                            <option>Engenharia & Produto</option>
                            <option>Customer Success</option>
                        </select>
                    </FormField>
                    <div className="col-span-2">
                         <FormField label="Salário Base (CLT/PJ)">
                            <input type="number" className="w-full border p-2 rounded font-bold" value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})} />
                        </FormField>
                    </div>
                    <div className="col-span-2">
                         <FormField label="Responsabilidades (Separe por vírgula)">
                            <textarea className="w-full border p-2 rounded h-20" value={formData.responsibilities} onChange={e => setFormData({...formData, responsibilities: e.target.value})} placeholder="Ex: Liderar equipe, Criar relatórios..." />
                        </FormField>
                    </div>
                    <div className="col-span-2 flex justify-end pt-4 border-t">
                        <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">Salvar Cargo</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};