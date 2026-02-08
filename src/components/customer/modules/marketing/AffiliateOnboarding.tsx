import React from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import { useUI } from '../../../../contexts/UIContext';
import { DollarSign, CheckCircle } from 'lucide-react';

// Esta é a tela que convida um cliente comum a se tornar um "Impulsionador" (afiliado).

export const AffiliateOnboarding: React.FC = () => {
    const { userProfile } = useAuth();
    const { showAlert } = useUI();

    const handleBecomeAffiliate = async () => {
        if (!userProfile?.uid) return;

        try {
            const userRef = doc(db, 'users', userProfile.uid);
            await updateDoc(userRef, {
                isAffiliate: true,
                affiliateBalance: 0,
                impulsionadorScore: { alcance: 0, engajamento: 0, conversao: 0, final: 10 }
            });
            showAlert("Parabéns! Você agora é um Impulsionador. Explore as campanhas disponíveis!", 'success');
            // O listener no AuthContext irá recarregar o perfil e a UI mudará automaticamente
        } catch (error) {
            console.error("Erro ao se tornar afiliado:", error);
            showAlert("Ocorreu um erro. Tente novamente.", 'error');
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Ganhe Dinheiro Indicando o Que Você Gosta!</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Torne-se um Impulsionador FoodPDV! Divulgue promoções dos seus restaurantes favoritos
                em suas redes sociais e ganhe uma comissão a cada venda realizada através do seu link exclusivo.
            </p>
            <button
                onClick={handleBecomeAffiliate}
                className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105"
            >
                Quero ser um Impulsionador Agora!
            </button>
        </div>
    );
};