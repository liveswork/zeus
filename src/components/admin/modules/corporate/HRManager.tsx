import React, { useState } from 'react';
import { Layout, FileText, Users, DollarSign } from 'lucide-react';
import { DepartmentsModule } from './DepartmentsModule';
import { JobRolesModule } from './JobRolesModule';
import { StaffingModule } from './StaffingModule';

export const HRManager: React.FC = () => {
    const [subModule, setSubModule] = useState<'depts' | 'roles' | 'staff'>('staff');

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Human Resources</h1>
                    <p className="text-slate-500">Gestão de Capital Humano e Cultura Organizacional</p>
                </div>
                <div className="flex bg-white p-1 rounded-lg border shadow-sm">
                    <button onClick={() => setSubModule('depts')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${subModule === 'depts' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>Departamentos</button>
                    <button onClick={() => setSubModule('roles')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${subModule === 'roles' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>Cargos</button>
                    <button onClick={() => setSubModule('staff')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${subModule === 'staff' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>Colaboradores</button>
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {subModule === 'depts' && <DepartmentsModule />}
                {subModule === 'roles' && <JobRolesModule />}
                {subModule === 'staff' && <StaffingModule />}
            </div>
        </div>
    );
};