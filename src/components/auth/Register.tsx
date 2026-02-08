// src/components/auth/Register.tsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Utensils, Phone } from 'lucide-react';
import { FormField } from '../ui/FormField';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { formatPhoneNumber } from '../../utils/formatters';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase'; // Importe a configuração do db

// Conexão com a sua Cloud Function
const functions = getFunctions();
const registerUserAndCustomer = httpsCallable(functions, 'registerUserAndCustomer');

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // NOVO: Estado para carregar as opções de fornecedor
  const [supplierOptions, setSupplierOptions] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'business',
    businessType: 'food_service',
    supplierType: '', // NOVO CAMPO
    supplierSubCategory: '', // NOVO CAMPO
  });

  // Efeito para buscar as categorias de fornecedor do Firestore
  useEffect(() => {
    const categoriesRef = collection(db, 'supplier_categories');
    const q = query(categoriesRef, orderBy("order"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const options = {};
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            options[doc.id] = { label: data.label, subCategories: data.subCategories || [] };
        });
        setSupplierOptions(options);
        // Define o valor inicial para os selects de fornecedor
        if (Object.keys(options).length > 0) {
            const firstTypeKey = Object.keys(options)[0];
            const firstSubCategoryKey = options[firstTypeKey]?.subCategories[0]?.key || '';
            setFormData(prev => ({
                ...prev,
                supplierType: prev.supplierType || firstTypeKey,
                supplierSubCategory: prev.supplierSubCategory || firstSubCategoryKey
            }));
        }
    });
    return () => unsubscribe();
  }, []);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'phone' ? formatPhoneNumber(value) : value;

    setFormData(prev => {
        const newState = { ...prev, [name]: finalValue };
        // Se o tipo de fornecedor mudar, reseta a subcategoria
        if (name === 'supplierType' && supplierOptions) {
            const firstSubCategoryKey = supplierOptions[value]?.subCategories[0]?.key || '';
            newState.supplierSubCategory = firstSubCategoryKey;
        }
        return newState;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
        setError("A senha deve ter no mínimo 6 caracteres.");
        return;
    }
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        phone: formData.phone.replace(/\D/g, ''),
      };
      await registerUserAndCustomer(payload);
      navigate('/painel');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <Utensils className="mx-auto text-blue-600" size={48} />
          <h1 className="text-3xl font-bold text-gray-800 mt-2">Crie sua Conta</h1>
          <p className="text-gray-500">Faça parte do ecossistema FoodPDV</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Etapa 1 */}
          <div className={step === 1 ? 'block' : 'hidden'}>
            <div className="space-y-4">
              <h3 className="text-xl font-bold">1. Identificação</h3>
              <FormField label="Seu Nome Completo"><input name="name" value={formData.name} onChange={handleChange} className="w-full p-3 border rounded-lg" required /></FormField>
              <FormField label="Seu E-mail Principal"><input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full p-3 border rounded-lg" required /></FormField>
              <FormField label="Seu Telefone (WhatsApp)"><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full p-3 pl-10 border rounded-lg" placeholder="(XX) XXXXX-XXXX" required /></div></FormField>
              <div className="text-right"><button type="button" onClick={() => setStep(2)} disabled={!formData.name || !formData.email || formData.phone.length < 14} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-400">Próximo</button></div>
            </div>
          </div>

          {/* Etapa 2 */}
          <div className={step === 2 ? 'block' : 'hidden'}>
            <div className="space-y-4">
                <h3 className="text-xl font-bold">2. Tipo de Conta</h3>
                 <FormField label="Eu sou um:">
                    <div className="grid grid-cols-3 gap-2 p-2 bg-gray-100 rounded-lg">
                        {['business', 'supplier', 'customer'].map(roleValue => (
                            <label key={roleValue} className="text-center cursor-pointer"><input type="radio" name="role" value={roleValue} checked={formData.role === roleValue} onChange={handleChange} className="sr-only" /><span className={`block p-3 rounded-md transition capitalize ${formData.role === roleValue ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'}`}>{roleValue === 'business' ? 'Negócio' : (roleValue === 'supplier' ? 'Fornecedor' : 'Cliente')}</span></label>
                        ))}
                    </div>
                </FormField>
                {formData.role === 'business' && (
                    <FormField label="Tipo de Negócio"><select name="businessType" value={formData.businessType} onChange={handleChange} className="w-full p-3 border rounded-lg"><option value="food_service">Food Service (Restaurante)</option><option value="retail">Varejo (Loja)</option><option value="atacado">Atacado</option></select></FormField>
                )}
                {/* CAMPOS DE FORNECEDOR ADICIONADOS AQUI */}
                {formData.role === 'supplier' && supplierOptions && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Tipo de Fornecedor"><select name="supplierType" value={formData.supplierType} onChange={handleChange} className="w-full p-3 border rounded-lg">{Object.keys(supplierOptions).map(key => (<option key={key} value={key}>{supplierOptions[key].label}</option>))}</select></FormField>
                        <FormField label="Ramo de Atividade"><select name="supplierSubCategory" value={formData.supplierSubCategory} onChange={handleChange} className="w-full p-3 border rounded-lg">{formData.supplierType && supplierOptions[formData.supplierType]?.subCategories.map(subCat => (<option key={subCat.key} value={subCat.key}>{subCat.label}</option>))}</select></FormField>
                    </div>
                )}
                <div className="flex justify-between"><button type="button" onClick={() => setStep(1)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg">Voltar</button><button type="button" onClick={() => setStep(3)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">Próximo</button></div>
            </div>
          </div>

          {/* Etapa 3 */}
          <div className={step === 3 ? 'block' : 'hidden'}>
            <div className="space-y-4">
                <h3 className="text-xl font-bold">3. Crie sua Senha</h3>
                <FormField label="Senha (mínimo 6 caracteres)"><input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full p-3 border rounded-lg" required minLength={6} /></FormField>
                {error && <p className="text-red-500 text-sm text-center p-3 bg-red-50 rounded-lg">{error}</p>}
                <div className="flex justify-between"><button type="button" onClick={() => setStep(2)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg">Voltar</button><button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-400">{loading ? 'Criando conta...' : 'Finalizar e Criar Conta'}</button></div>
            </div>
          </div>
        </form>

        <div className="text-center mt-6"><Link to="/login" className="text-sm text-blue-600 hover:underline">Já tem uma conta? Faça o login.</Link></div>
      </div>
    </div>
  );
};