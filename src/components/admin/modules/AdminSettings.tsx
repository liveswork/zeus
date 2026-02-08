import React, { useState } from 'react';
import { Save, Settings, Bell, Shield, Database, Cog } from 'lucide-react';
import { FormField } from '../../ui/FormField';
import { useUI } from '../../../contexts/UIContext';

export const AdminSettings: React.FC = () => {
  const { showAlert } = useUI();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sistema');

  const tabs = [
    { id: 'sistema', label: 'Sistema', icon: <Settings size={18} /> },
    { id: 'notificacoes', label: 'Notificações', icon: <Bell size={18} /> },
    { id: 'seguranca', label: 'Segurança', icon: <Shield size={18} /> },
    { id: 'database', label: 'Database', icon: <Database size={18} /> }
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showAlert('Configurações do sistema salvas com sucesso!');
    } catch (error) {
      showAlert('Erro ao salvar configurações', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Configurações do Sistema</h1>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-green-700 transition disabled:bg-gray-400"
        >
          <Save size={20} className="mr-2" />
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-6">
          {activeTab === 'sistema' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Configurações Gerais do Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Nome da Plataforma">
                  <input
                    defaultValue="FoodPDV"
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </FormField>
                
                <FormField label="Versão do Sistema">
                  <input
                    defaultValue="2.0.0"
                    readOnly
                    className="w-full p-3 border rounded-md bg-gray-100"
                  />
                </FormField>
              </div>
            </div>
          )}

          {activeTab === 'notificacoes' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Configurações de Notificação</h3>
              <p className="text-gray-600">Configurações de notificação serão implementadas aqui.</p>
            </div>
          )}

          {activeTab === 'seguranca' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Configurações de Segurança</h3>
              <p className="text-gray-600">Configurações de segurança serão implementadas aqui.</p>
            </div>
          )}

          {activeTab === 'database' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Configurações do Database</h3>
              <p className="text-gray-600">Configurações do database serão implementadas aqui.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};