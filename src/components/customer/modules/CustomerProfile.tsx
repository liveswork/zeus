import React, { useState, useEffect } from 'react';
import { Save, User, Phone, Mail, MapPin, FileText, Ticket, Loader } from 'lucide-react'; // --- Ticket e Loader Adicionados ---
import { FormField } from '../../ui/FormField';
import { useAuth } from '../../../contexts/AuthContext';
import { useUI } from '../../../contexts/UIContext';
// --- NOVOS IMPORTS ---
import { functions } from '../../../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
// --- FIM NOVOS IMPORTS ---

// --- NOVA CLOUD FUNCTION ---
const generateLotteryCode = httpsCallable(functions, 'generateLotteryCode');

export const CustomerProfile: React.FC = () => {
  const { userProfile, loading: authLoading } = useAuth(); // Renomeado 'loading' para evitar conflito
  const { showAlert } = useUI();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    address: '',
    wantsToParticipateInDraws: false,
  });

  // Efeito para carregar os dados do perfil quando ele estiver disponível
  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        email: userProfile.email || '',
        phone: userProfile.profile?.whatsapp || '',
        address: userProfile.profile?.address || '',
        wantsToParticipateInDraws: userProfile.wantsToParticipateInDraws || false,
      });
    }
  }, [userProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    
    setLoading(true);
    
    try {
      // Verifica se o usuário está OPTANDO POR PARTICIPAR e ainda NÃO TEM um código
      const isOptingIn = formData.wantsToParticipateInDraws && !userProfile.lotteryCode;
      
      if (isOptingIn) {
        // 1. Chama a Cloud Function para gerar o código e salvar
        showAlert("Gerando seu número da sorte...", "info");
        await generateLotteryCode();
        // O AuthContext vai atualizar o userProfile automaticamente com o novo código
        showAlert('Você agora está participando do Show do Comilhão!', 'success');
      
      } else {
        // 2. Apenas salva as outras informações do perfil (nome, email, etc.)
        // E também salva se o usuário decidiu NÃO participar (wantsToParticipateInDraws: false)
        const userRef = doc(db, 'users', userProfile.uid);
        await updateDoc(userRef, {
            displayName: formData.displayName,
            email: formData.email,
            "profile.whatsapp": formData.phone,
            "profile.address": formData.address,
            wantsToParticipateInDraws: formData.wantsToParticipateInDraws
        });
        showAlert('Perfil atualizado com sucesso!');
      }

    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      showAlert(error.message || 'Erro ao atualizar perfil', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  if (authLoading) {
      return <div>Carregando perfil...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Meu Perfil</h1>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loading ? <Loader size={20} className="mr-2 animate-spin" /> : <Save size={20} className="mr-2" />}
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Nome Completo">
            <div className="flex items-center">
              <User className="text-gray-400 mr-2" size={20} />
              <input
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </FormField>
          
          <FormField label="E-mail">
            <div className="flex items-center">
              <Mail className="text-gray-400 mr-2" size={20} />
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </FormField>
          
          <FormField label="Telefone">
            <div className="flex items-center">
              <Phone className="text-gray-400 mr-2" size={20} />
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(XX) XXXXX-XXXX"
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </FormField>
        </div>
        
        <FormField label="Endereço">
          <div className="flex items-start">
            <MapPin className="text-gray-400 mr-2 mt-3" size={20} />
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </FormField>

        {/* --- NOVA SEÇÃO: SHOW DO COMILHÃO --- */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg shadow-inner border border-purple-200">
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
            <Ticket size={24} className="text-purple-600" />
            Show do Comilhão
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="wantsToParticipateInDraws"
                checked={formData.wantsToParticipateInDraws}
                onChange={handleChange}
                className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                disabled={loading}
              />
              <span className="text-gray-700 font-medium">
                Sim, quero participar dos sorteios do programa!
              </span>
            </label>

            {userProfile?.lotteryCode && (
              <div className="p-4 bg-white border border-green-300 rounded-lg text-center">
                <p className="text-sm text-green-700">Seu número da sorte é:</p>
                <p className="text-4xl font-bold text-green-600 tracking-widest my-2">
                  {userProfile.lotteryCode}
                </p>
                <p className="text-xs text-gray-500">
                  Este número é único e será usado em todos os sorteios. Boa sorte!
                </p>
              </div>
            )}
            
            {!userProfile?.lotteryCode && formData.wantsToParticipateInDraws && (
              <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-center">
                <p className="text-sm text-yellow-700">
                  Seu número da sorte será gerado e exibido aqui assim que você <strong>salvar as alterações</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
        {/* --- FIM DA NOVA SEÇÃO --- */}
      </form>
    </div>
  );
};