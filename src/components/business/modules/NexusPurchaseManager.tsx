// src/components/business/modules/NexusPurchaseManager.tsx
import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../../contexts/BusinessContext';
import { db, functions } from '../../../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import { Zap, Check, X, ShoppingCart, Star } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { useNavigate } from 'react-router-dom';

// Aponta para a nova função de cobrança
const processNexusClickCallable = httpsCallable(functions, 'processNexusClick');

export const NexusPurchaseManager = () => {
    const { userProfile, showAlert } = useBusiness();
    const navigate = useNavigate();
    const [draftOrders, setDraftOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const businessId = userProfile?.businessId;

    useEffect(() => {
        if (!businessId) return;
        const q = query(collection(db, 'nexusPurchaseOrders'), where('businessId', '==', businessId), where('status', '==', 'draft'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setDraftOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [businessId]);

    const handleApproveQuote = async (nexusOrder, selectedOption, quantity) => {
        try {
            const batch = writeBatch(db);

            // Se a opção for patrocinada, chama a função de cobrança ANTES de tudo
            if (selectedOption.isSponsored) {
                await processNexusClickCallable({
                    campaignId: selectedOption.campaignId,
                    cpcBid: selectedOption.cpcBid
                });
            }

            const newPurchaseOrderRef = doc(collection(db, 'purchaseOrders'));
            const purchaseOrderData = {
                businessId,
                supplierId: selectedOption.supplierId,
                supplierName: selectedOption.supplierName,
                items: [{ supplyId: nexusOrder.supplyId, _productName: selectedOption.productName, productId: selectedOption.productId, quantity, unitCost: selectedOption.price }],
                totalAmount: selectedOption.price * quantity,
                status: 'enviado_ao_fornecedor',
                createdAt: new Date().toISOString(),
                restaurantName: userProfile.companyName,
                origin: 'nexus_ai'
            };
            batch.set(newPurchaseOrderRef, purchaseOrderData);
            
            const nexusOrderRef = doc(db, 'nexusPurchaseOrders', nexusOrder.id);
            batch.update(nexusOrderRef, { status: 'approved', approvedBy: userProfile.uid, approvedAt: new Date(), chosenOption: selectedOption });

            await batch.commit();
            showAlert("Orçamento aprovado e enviado ao fornecedor com sucesso!");
            navigate('/painel/compras_orcamentos');

        } catch (error) {
            showAlert(error.message || "Erro ao aprovar o orçamento.", "error");
        }
    };

    const handleDismissQuote = async (nexusOrderId) => {
        const nexusOrderRef = doc(db, 'nexusPurchaseOrders', nexusOrderId);
        await writeBatch(db).update(nexusOrderRef, { status: 'dismissed' }).commit();
        showAlert("Sugestão dispensada.");
    };

    if (loading) return <div>Buscando sugestões da IA...</div>;

    return (
        <div className="space-y-6">
            {/* ... (cabeçalho permanece o mesmo) ... */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold">Assistente de Compras Nexus</h1>
                <p className="text-blue-100 mt-1">Sua IA para cotações e compras inteligentes. As melhores ofertas para o seu estoque aparecem aqui.</p>
            </div>
            
            {draftOrders.length === 0 ? (
                <div className="text-center bg-white p-12 rounded-lg shadow-md">
                    <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 font-semibold">Nenhuma sugestão de compra no momento.</p>
                    <p className="text-sm text-gray-500">Quando seu estoque de um item vinculado a fornecedores ficar baixo, a IA irá gerar cotações aqui.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {draftOrders.map(order => (
                        <NexusQuoteCard key={order.id} order={order} onApprove={handleApproveQuote} onDismiss={handleDismissQuote} />
                    ))}
                </div>
            )}
        </div>
    );
};

const NexusQuoteCard = ({ order, onApprove, onDismiss }) => {
    const [quantity, setQuantity] = useState(1);
    
    return (
        <div className="bg-white rounded-lg shadow-lg border-l-4 border-purple-500 overflow-hidden">
            {/* ... (cabeçalho do card permanece o mesmo) ... */}
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-gray-500">Sugestão para reposição de:</p>
                        <h2 className="text-2xl font-bold text-gray-800">{order.supplyName}</h2>
                    </div>
                    <button onClick={() => onDismiss(order.id)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
                </div>
            </div>

            <div className="px-6 pb-6 space-y-3">
                {order.quoteOptions.map((opt) => (
                    <div key={opt.productId} className={`p-4 rounded-md flex flex-col md:flex-row justify-between items-center gap-4 transition-all ${opt.isSponsored ? 'bg-yellow-50 border-2 border-yellow-400 shadow-md' : 'bg-gray-50'}`}>
                        {opt.isSponsored && (
                            <div className="w-full md:w-auto text-center md:text-left text-xs font-bold text-yellow-700 uppercase flex items-center gap-1 mb-2 md:mb-0">
                                <Star size={14}/> Oferta Patrocinada
                            </div>
                        )}
                        <div className="flex-grow text-center md:text-left">
                            <p className="font-bold">{opt.supplierName}</p>
                            <p className="text-sm text-gray-600">{opt.productName}</p>
                            <p className="text-lg font-bold text-green-700">{formatCurrency(opt.price)} <span className="text-xs text-gray-500">/ {opt.unitOfSale}</span></p>
                        </div>
                        <button onClick={() => onApprove(order, opt, quantity)} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 hover:bg-green-700 w-full md:w-auto justify-center">
                            <Check size={18} /> Aprovar
                        </button>
                    </div>
                ))}
            </div>
            
            <div className="bg-gray-100 p-4 flex items-center justify-end gap-4">
                <label className="font-semibold">Quantidade a comprar:</label>
                <input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)} min="1" className="w-24 p-2 border rounded-md text-center" />
            </div>
        </div>
    );
};