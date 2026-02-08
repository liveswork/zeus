import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, Database, ArrowRight, User, CheckCircle, Loader } from 'lucide-react';
import { useUI } from '../../../../contexts/UIContext';
import { DataMapper } from './DataMapper';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, functions, auth } from '../../../../config/firebase'; // Importar functions
import { httpsCallable } from 'firebase/functions'; // Importar httpsCallable
import { FormField } from '../../../ui/FormField'; // <<< A CORREÇÃO CRÍTICA ESTÁ AQUI

// Função da Cloud a ser chamada
const processAndMigrateLegacyData = httpsCallable(functions, 'processAndMigrateLegacyData');


// Perfis pré-definidos para concorrentes
const MIGRATION_PROFILES = [
    { id: 'custom_csv', name: 'CSV Genérico', icon: FileText },
    { id: 'anotaai', name: 'Anota.ai', icon: Database, disabled: true },
    { id: 'consumer', name: 'Consumer', icon: Database, disabled: true },
    { id: 'grandchef', name: 'GrandChef', icon: Database, disabled: true },
    { id: 'sischef', name: 'Sischef', icon: Database, disabled: true },
];

export const DataImporter: React.FC = () => {
    const { showAlert } = useUI();
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [loadingBusinesses, setLoadingBusinesses] = useState(true);
    const [targetBusinessId, setTargetBusinessId] = useState('');
    const [files, setFiles] = useState<FileList | null>(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);
    const [parsedData, setParsedData] = useState<any>(null);

    // Função para verificar se o usuário é superadmin
    const checkSuperAdmin = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                showAlert("Você precisa estar logado para executar esta ação.", "error");
                return false;
            }

            const userDoc = await getDocs(query(
                collection(db, 'users'), 
                where("__name__", "==", currentUser.uid)
            ));
            
            if (userDoc.empty || userDoc.docs[0].data()?.role !== 'superadmin') {
                showAlert("Acesso negado. Apenas administradores podem executar migrações.", "error");
                return false;
            }
            
            return true;
        } catch (error) {
            console.error("Erro ao verificar permissões:", error);
            showAlert("Erro ao verificar permissões.", "error");
            return false;
        }
    };
    // Verificação de permissão ao montar o componente
    useEffect(() => {
        checkSuperAdmin();
    }, []);

    // useEffect para buscar negócios
    useEffect(() => {
        const fetchBusinesses = async () => {
            const q = query(collection(db, 'users'), where("role", "==", "business"));
            const snapshot = await getDocs(q);
            setBusinesses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoadingBusinesses(false);
        };
        fetchBusinesses();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFiles(e.target.files);
    };

    const handleAnalyzeData = async () => {
        if (!targetBusinessId || !files) {
            showAlert("Selecione um estabelecimento e faça upload dos arquivos.", "warning");
            return;
        }

        // Verificar permissões antes de prosseguir
        const hasPermission = await checkSuperAdmin();
        if (!hasPermission) return;

        setIsLoading(true);
        
        try {
            const filesContentPromises = Array.from(files).map(file =>
                file.text().then(text => ({ fileName: file.name, content: text }))
            );
            const filesContentArray = await Promise.all(filesContentPromises);
            const filesData = filesContentArray.reduce((acc, file) => ({...acc, [file.fileName]: file.content }), {});

            // Chamar a função com autenticação
            const result: any = await processAndMigrateLegacyData({ 
                stage: 'analyze', 
                targetBusinessId,
                filesData 
            });
            
            if (result.data.success) {
                setAnalysisResult(result.data.analysis);
                setStep(2);
                showAlert("Análise concluída com sucesso!", "success");
            }
        } catch (error: any) {
            console.error("Erro na análise:", error);
            showAlert(`Erro na análise: ${error.message || "Verifique o console para detalhes"}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    
    
    const handleExecuteMigration = async (mappings: any) => {
        if (!files || !targetBusinessId) {
            showAlert("Dados necessários não encontrados.", "error");
            return;
        }

        // Verificar permissões novamente
        const hasPermission = await checkSuperAdmin();
        if (!hasPermission) return;

        setIsMigrating(true);
        try {
            const filesContentPromises = Array.from(files).map(file => {
                return file.text().then(text => ({ fileName: file.name, content: text }));
            });
            const filesContentArray = await Promise.all(filesContentPromises);
            const filesData = filesContentArray.reduce((acc, file) => {
                acc[file.fileName] = file.content;
                return acc;
            }, {});

            const payload = {
                stage: 'execute',
                targetBusinessId,
                filesData,
                mappings // Inclui columnMapping e valueMapping
            };

            const result: any = await processAndMigrateLegacyData(payload);

            if (result.data.success) {
                showAlert(result.data.message, "success");
                setStep(3);
            } else {
                throw new Error(result.data.message);
            }
        } catch (error: any) {
            console.error("Erro na migração:", error);
            showAlert(`Falha na migração: ${error.message}`, "error");
        } finally {
            setIsMigrating(false);
        }
    };

    const targetBusiness = businesses.find(b => b.id === targetBusinessId);

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Motor de Migração Chronos</h1>
            
            {/* Passo 1 */}
            <div className={`p-8 bg-white rounded-lg shadow-md border-l-4 ${step >= 1 ? 'border-blue-500' : 'border-gray-200'}`}>
                 <h2 className="text-2xl font-semibold mb-4">Passo 1: Seleção de Alvo e Origem</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                         <FormField label="1. Selecione o Estabelecimento de Destino">
                             <select value={targetBusinessId} onChange={(e) => setTargetBusinessId(e.target.value)} className="w-full p-3 border rounded-lg bg-gray-50" disabled={loadingBusinesses}>
                                 <option value="">{loadingBusinesses ? "Carregando..." : "Selecione um cliente..."}</option>
                                 {businesses.map(b => <option key={b.id} value={b.id}>{b.companyName}</option>)}
                             </select>
                         </FormField>
                         {targetBusiness && (
                             <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                                 <p><strong>ID do Alvo:</strong> {targetBusiness.id}</p>
                                 <p><strong>Email:</strong> {targetBusiness.email}</p>
                             </div>
                         )}
                     </div>
                     <div>
                          <h3 className="font-semibold text-gray-700 mb-3">2. Faça o upload dos arquivos CSV</h3>
                          <div className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center">
                               <UploadCloud size={40} className="text-gray-400 mb-2" />
                               <input type="file" multiple onChange={handleFileChange} className="text-sm" accept=".csv" />
                               {files && <p className="text-sm mt-2 text-green-600">{files.length} arquivo(s) selecionado(s).</p>}
                          </div>
                     </div>
                 </div>
                  <div className="text-right mt-6">
                     <button onClick={handleAnalyzeData} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50" disabled={!targetBusinessId || !files}>
                         Analisar e Mapear Colunas <ArrowRight size={18} />
                     </button>
                  </div>
            </div>

            {/* Passo 2 */}
            {step === 2 && analysisResult && (
                <div className="p-8 bg-white rounded-lg shadow-md border-l-4 border-purple-500">
                    <h2 className="text-2xl font-semibold mb-4">Passo 2: Fusão Semântica</h2>
                    <DataMapper 
                        analysis={analysisResult} 
                        onComplete={handleExecuteMigration} 
                    />
                </div>
            )}
            
            {/* Passo 3: Sucesso */}
            {step === 3 && (
                 <div className="p-8 bg-white rounded-lg shadow-md border-l-4 border-green-500 text-center">
                     <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                     <h2 className="text-2xl font-semibold mb-2">Universo Recriado!</h2>
                     <p className="text-gray-600">A migração foi concluída com sucesso. Os dados do sistema legado agora fazem parte do ecossistema FoodPDV.</p>
                     <button onClick={() => setStep(1)} className="mt-6 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg">
                         Iniciar Nova Migração
                     </button>
                 </div>
            )}
        </div>
    );
};
