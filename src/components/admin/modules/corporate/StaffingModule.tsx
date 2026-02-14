import React, { useState, useEffect } from 'react';
import { UserPlus, Search, UserCheck, Calendar, Briefcase } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { Modal } from '../../../ui/Modal';
import { FormField } from '../../../ui/FormField';

export const StaffingModule: React.FC = () => {
    const [employees, setEmployees] = useState<any[]>([]); // Lista de contratados
    const [systemUsers, setSystemUsers] = useState<any[]>([]); // Lista de todos os usuários do sistema (para buscar)
    const [isHireModalOpen, setIsHireModalOpen] = useState(false);
    
    // Estado do Formulário de Contratação
    const [selectedUser, setSelectedUser] = useState<string>(''); // Email ou ID
    const [selectedRole, setSelectedRole] = useState('');
    const [salary, setSalary] = useState(0);
    const [admissionDate, setAdmissionDate] = useState('');

    // Busca usuários reais do sistema para o Select
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Buscando da coleção 'users' que já existe no seu sistema
                const q = query(collection(db, 'users'), orderBy('email'));
                const snapshot = await getDocs(q);
                const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSystemUsers(users);
            } catch (error) {
                console.error("Erro ao buscar usuários:", error);
            }
        };
        fetchUsers();
    }, []);

    const handleHire = () => {
        // Aqui salvaríamos no banco 'employees'
        const user = systemUsers.find(u => u.email === selectedUser);
        if (!user) return;

        const newEmployee = {
            id: Date.now().toString(),
            name: user.name || user.email,
            email: user.email,
            role: selectedRole,
            salary: salary,
            admissionDate: admissionDate,
            status: 'Ativo'
        };
        
        setEmployees([...employees, newEmployee]);
        setIsHireModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Colaboradores (Staff)</h2>
                    <p className="text-gray-500">Gestão de contratos, admissões e alocações.</p>
                </div>
                <button 
                    onClick={() => setIsHireModalOpen(true)} 
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700"
                >
                    <UserPlus size={20} /> Nova Contratação
                </button>
            </div>

            {/* Lista de Funcionários */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-sm font-bold uppercase">
                        <tr>
                            <th className="p-4">Colaborador</th>
                            <th className="p-4">Cargo Atual</th>
                            <th className="p-4">Admissão</th>
                            <th className="p-4">Salário</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum colaborador contratado ainda.</td></tr>
                        ) : (
                            employees.map(emp => (
                                <tr key={emp.id} className="border-t hover:bg-gray-50">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {emp.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800">{emp.name}</div>
                                            <div className="text-xs text-gray-500">{emp.email}</div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-700 font-medium">{emp.role}</td>
                                    <td className="p-4 text-gray-600 text-sm">{new Date(emp.admissionDate).toLocaleDateString()}</td>
                                    <td className="p-4 font-mono text-gray-800">R$ {emp.salary.toLocaleString()}</td>
                                    <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">{emp.status}</span></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Contratação */}
            <Modal isOpen={isHireModalOpen} onClose={() => setIsHireModalOpen(false)} title="Admitir Colaborador">
                <div className="p-6 space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                        <p className="text-sm text-blue-800 flex items-center gap-2">
                            <UserCheck size={16} /> 
                            Vincule um usuário já cadastrado no Nexus OS a uma função oficial.
                        </p>
                    </div>

                    <FormField label="Selecionar Usuário (Busca por Email)">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                            <input 
                                list="users-list" 
                                className="w-full border p-2 pl-10 rounded" 
                                placeholder="Digite o email..." 
                                value={selectedUser}
                                onChange={e => setSelectedUser(e.target.value)}
                            />
                            <datalist id="users-list">
                                {systemUsers.map((u: any) => (
                                    <option key={u.id} value={u.email}>{u.name || 'Sem nome'}</option>
                                ))}
                            </datalist>
                        </div>
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Cargo / Função">
                            <select className="w-full border p-2 rounded" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                                <option value="">Selecione...</option>
                                <option>SDR (Pré-vendas)</option>
                                <option>Engenheiro de Software</option>
                                <option>Suporte N1</option>
                            </select>
                        </FormField>
                        <FormField label="Data de Admissão">
                            <input type="date" className="w-full border p-2 rounded" value={admissionDate} onChange={e => setAdmissionDate(e.target.value)} />
                        </FormField>
                    </div>

                    <FormField label="Salário Inicial (R$)">
                        <input type="number" className="w-full border p-2 rounded font-bold" value={salary} onChange={e => setSalary(Number(e.target.value))} />
                    </FormField>

                    <div className="flex justify-end pt-4 border-t mt-4">
                        <button onClick={handleHire} className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 shadow-md">
                            Confirmar Contratação
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};