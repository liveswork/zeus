import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Utensils, Phone } from 'lucide-react';
import { FormField } from '../ui/FormField';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { formatPhoneNumber } from '../../utils/formatters';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';

const functions = getFunctions();
const registerUserAndCustomer = httpsCallable(functions, 'registerUserAndCustomer');

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Variáveis para guardar as opções vindas do banco
  const [businessOptions, setBusinessOptions] = useState<any>({});
  const [supplierOptions, setSupplierOptions] = useState<any>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'business',
    businessType: '', 
    businessSubCategory: '',
    supplierType: '',
    supplierSubCategory: '',
  });

  // --- CONEXÃO COM O BANCO ANTIGO ---
  // Busca as categorias de negócio que você já criou no sistema antigo
  useEffect(() => {
    const q = query(collection(db, 'business_categories'), orderBy("order"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const options: any = {};
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Monta a estrutura igual ao seu App.jsx antigo
            options[doc.id] = { 
                label: data.label, 
                subCategories: data.subCategories || [] 
            };
        });
        setBusinessOptions(options);

        // Seleciona o primeiro item automaticamente para não bugar
        if (Object.keys(options).length > 0) {
            const firstKey = Object.keys(options)[0];
            const firstSub = options[firstKey].subCategories[0]?.key || '';
            setFormData(prev => ({ 
                ...prev, 
                businessType: firstKey,
                businessSubCategory: firstSub 
            }));
        }
    });
    return () => unsubscribe();
  }, []);

  // Busca categorias de fornecedores (se houver)
  useEffect(() => {
    const fetchSuppliers = async () => {
        const q = query(collection(db, 'supplier_categories'), orderBy("order"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const options: any = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                options[doc.id] = { label: data.label, subCategories: data.subCategories || [] };
            });
            setSupplierOptions(options);
        });
        return () => unsubscribe();
    };
    fetchSuppliers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'phone' ? formatPhoneNumber(value) : value;

    setFormData(prev => {
        const newState = { ...prev, [name]: finalValue };
        
        // Se mudou a categoria principal, seleciona a primeira subcategoria dela automaticamente
        if (name === 'businessType' && businessOptions[value]) {
            newState.businessSubCategory = businessOptions[value].subCategories[0]?.key || '';
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
          <p className="text-gray-500">Junte-se ao ecossistema Nexus</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Passo 1: Dados Pessoais */}
          <div className={step === 1 ? 'block' : 'hidden'}>
            <div className="space-y-4">
              <h3 className="text-xl font-bold">1. Seus Dados</h3>
              <FormField label="Nome Completo">
                  <input name="name" value={formData.name} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </FormField>
              <FormField label="E-mail">
                  <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </FormField>
              <FormField label="WhatsApp">
                  <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full p-3 pl-10 border rounded-lg" placeholder="(XX) XXXXX-XXXX" required />
                  </div>
              </FormField>
              <div className="text-right">
                  <button type="button" onClick={() => setStep(2)} disabled={!formData.name || !formData.email || formData.phone.length < 14} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-400 transition-colors">
                      Continuar
                  </button>
              </div>
            </div>
          </div>

          {/* Passo 2: Tipo de Negócio (AQUI É A MÁGICA) */}
          <div className={step === 2 ? 'block' : 'hidden'}>
            <div className="space-y-4">
                <h3 className="text-xl font-bold">2. Sobre seu Negócio</h3>
                 
                 <FormField label="Eu sou:">
                    <div className="grid grid-cols-3 gap-2 p-2 bg-gray-100 rounded-lg">
                        {[
                            { val: 'business', label: 'Lojista' },
                            { val: 'supplier', label: 'Fornecedor' },
                            { val: 'customer', label: 'Cliente' }
                        ].map(opt => (
                            <label key={opt.val} className="text-center cursor-pointer">
                                <input type="radio" name="role" value={opt.val} checked={formData.role === opt.val} onChange={handleChange} className="sr-only" />
                                <span className={`block p-2 text-sm font-bold rounded-md transition ${formData.role === opt.val ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-200'}`}>
                                    {opt.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </FormField>

                {/* Se for LOJISTA, mostra as opções vindas do 'business_categories' */}
                {formData.role === 'business' && (
                    <div className="space-y-4">
                        <FormField label="Ramo de Atividade">
                            {Object.keys(businessOptions).length > 0 ? (
                                <select name="businessType" value={formData.businessType} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white">
                                    {Object.keys(businessOptions).map(key => (
                                        <option key={key} value={key}>
                                            {businessOptions[key].label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-red-500 text-sm">Nenhuma categoria encontrada no banco.</p>
                            )}
                        </FormField>

                        {/* Mostra as subcategorias (ex: Pizzaria, Hamburgueria) */}
                        <FormField label="Especialidade">
                             <select name="businessSubCategory" value={formData.businessSubCategory} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white">
                                {formData.businessType && businessOptions[formData.businessType]?.subCategories.map((sub: any) => (
                                    <option key={sub.key} value={sub.key}>
                                        {sub.label}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                    </div>
                )}

                <div className="flex justify-between pt-4">
                    <button type="button" onClick={() => setStep(1)} className="text-gray-600 hover:text-gray-800 font-bold px-4">Voltar</button>
                    <button type="button" onClick={() => setStep(3)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">Próximo</button>
                </div>
            </div>
          </div>

          {/* Passo 3: Senha */}
          <div className={step === 3 ? 'block' : 'hidden'}>
            <div className="space-y-4">
                <h3 className="text-xl font-bold">3. Segurança</h3>
                <FormField label="Defina sua Senha">
                    <input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full p-3 border rounded-lg" required minLength={6} placeholder="Mínimo 6 caracteres" />
                </FormField>
                
                {error && (
                    <div className="text-red-600 text-sm text-center p-3 bg-red-50 rounded-lg border border-red-100 flex items-center justify-center gap-2">
                        ⚠️ {error}
                    </div>
                )}

                <div className="flex justify-between pt-4">
                    <button type="button" onClick={() => setStep(2)} className="text-gray-600 hover:text-gray-800 font-bold px-4">Voltar</button>
                    <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 flex items-center gap-2">
                        {loading ? 'Criando...' : 'Finalizar Cadastro'}
                    </button>
                </div>
            </div>
          </div>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-gray-100">
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Já tem conta? Fazer login
            </Link>
        </div>
      </div>
    </div>
  );
};