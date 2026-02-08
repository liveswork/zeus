import React, { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { LayoutGrid, Tags, Plus, Trash2, Edit3, Save, X } from 'lucide-react';
import { useUI } from '../../../contexts/UIContext';

export const TaxonomyManager: React.FC = () => {
  const [sectors, setSectors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert, showConfirmation } = useUI();

  // Estados para novos cadastros
  const [newSector, setNewSector] = useState({ name: '', icon: '', description: '' });
  const [isAddingSector, setIsAddingSector] = useState(false);

  useEffect(() => {
    fetchTaxonomy();
  }, []);

  const fetchTaxonomy = async () => {
    setLoading(true);
    try {
      const sectorsSnap = await getDocs(query(collection(db, 'global_sectors'), orderBy('name')));
      const categoriesSnap = await getDocs(query(collection(db, 'global_categories'), orderBy('name')));
      
      setSectors(sectorsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCategories(categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      showAlert('Erro ao carregar taxonomia', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSector = async () => {
    if (!newSector.name) return;
    try {
      await addDoc(collection(db, 'global_sectors'), newSector);
      showAlert('Novo setor de negócio adicionado!', 'success');
      setNewSector({ name: '', icon: '', description: '' });
      setIsAddingSector(false);
      fetchTaxonomy();
    } catch (error) {
      showAlert('Erro ao salvar setor', 'error');
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Taxonomia do Ecossistema</h1>
          <p className="text-gray-500">Defina setores (Óticas, Farmácias, Varejo) e suas categorias globais.</p>
        </div>
        <button 
          onClick={() => setIsAddingSector(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
        >
          <Plus size={20} /> Novo Setor de Negócio
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lista de Setores */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <LayoutGrid className="text-indigo-600" /> Setores Ativos
          </h3>
          <div className="space-y-3">
            {sectors.map(sector => (
              <div key={sector.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg group">
                <div>
                  <p className="font-bold text-gray-700">{sector.name}</p>
                  <p className="text-xs text-gray-400">{sector.description || 'Sem descrição'}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"><Edit3 size={16} /></button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-md"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categorias Globais */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Tags className="text-emerald-600" /> Categorias de Produtos (Global)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {categories.map(cat => (
              <div key={cat.id} className="p-3 border rounded-lg flex justify-between items-center hover:border-emerald-200 transition">
                <span className="text-sm font-medium text-gray-600">{cat.name}</span>
                <span className="text-[10px] bg-gray-100 px-2 py-1 rounded uppercase">{cat.sectorId || 'Geral'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Adição (Simples) */}
      {isAddingSector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Novo Tipo de Negócio</h2>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Ex: Farmácia, Ótica, Papelaria..." 
                className="w-full p-3 border rounded-xl"
                value={newSector.name}
                onChange={e => setNewSector({...newSector, name: e.target.value})}
              />
              <textarea 
                placeholder="Descrição das regras deste setor" 
                className="w-full p-3 border rounded-xl"
                value={newSector.description}
                onChange={e => setNewSector({...newSector, description: e.target.value})}
              />
              <div className="flex gap-3">
                <button onClick={() => setIsAddingSector(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Cancelar</button>
                <button onClick={handleAddSector} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Salvar Setor</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};