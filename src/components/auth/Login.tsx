import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Utensils, Lock, Mail, Wifi, WifiOff, Loader, RefreshCw } from 'lucide-react'; // Adicionei RefreshCw
import { auth } from '../../config/firebase';
import { FormField } from '../ui/FormField';
import { useAuth } from '../../contexts/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, loginOffline, isOfflineMode } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkingNet, setCheckingNet] = useState(false);
  
  // Estado inicial baseado no contexto, mas verificável
  const [localOffline, setLocalOffline] = useState(isOfflineMode);

  // 🟢 NAVEGAÇÃO ÚNICA
  useEffect(() => {
    if (!loading && user) {
      console.log('🚀 Nexus OS: Usuário autenticado, iniciando sistema...');
      navigate('/painel', { replace: true });
    }
  }, [user, loading, navigate]);

  // 🟢 VERIFICADOR DE CONEXÃO REAL (PING)
const checkRealConnection = useCallback(async () => {
  setCheckingNet(true);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch('https://1.1.1.1/cdn-cgi/trace', {
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!res.ok) throw new Error('No internet');

    setLocalOffline(false);
    setError('');
    console.log('🌐 Nexus OS: Internet real confirmada');
  } catch {
    console.warn('📴 Nexus OS: Internet indisponível');
    setLocalOffline(true);
  } finally {
    clearTimeout(timeout);
    setCheckingNet(false);
  }
}, []);

useEffect(() => {
  checkRealConnection(); // inicial

  const interval = setInterval(() => {
    checkRealConnection();
  }, 5000); // a cada 5s

  return () => clearInterval(interval);
}, [checkRealConnection]);

  // Monitora e verifica ao iniciar e quando o contexto muda
useEffect(() => {
  const handleOffline = () => setLocalOffline(true);
  const handleOnline = () => checkRealConnection();

  window.addEventListener('offline', handleOffline);
  window.addEventListener('online', handleOnline);

  return () => {
    window.removeEventListener('offline', handleOffline);
    window.removeEventListener('online', handleOnline);
  };
}, [checkRealConnection]);

  // Sincroniza se o contexto forçar uma mudança
  useEffect(() => {
      if (isOfflineMode !== undefined) setLocalOffline(isOfflineMode);
  }, [isOfflineMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Antes de tentar logar, verifica a conexão real uma última vez
    if (!localOffline) {
        try {
            await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
        } catch {
            setLocalOffline(true);
            setSubmitting(false);
            return; // Interrompe para mudar a UI para offline
        }
    }

    try {
      if (localOffline) {
        // MODO OFFLINE
        console.log('🔒 Nexus OS: Autenticação Local Iniciada...');
        const success = await loginOffline(email, password);
        
        if (!success) {
            setError('Credenciais locais inválidas ou usuário não sincronizado.');
            setSubmitting(false);
        }
      } else {
        // MODO ONLINE
        console.log('☁️ Nexus OS: Autenticação em Nuvem Iniciada...');
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Erro de Login:', err);
      let msg = 'Falha ao acessar o sistema.';
      
      if (err.code === 'auth/network-request-failed') {
          msg = 'Conexão instável detectada. Alternando para modo offline...';
          setLocalOffline(true); // Auto-switch inteligente
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
          msg = 'Email ou senha incorretos.';
      } else if (err.code === 'auth/too-many-requests') {
          msg = 'Muitas tentativas. Aguarde um momento.';
      }
      
      setError(msg);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
        <Loader className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-gray-500 font-medium">Iniciando Nexus OS...</p>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Cabeçalho */}
        <div className={`p-8 text-center transition-colors duration-300 ${localOffline ? 'bg-gray-900' : 'bg-blue-600'}`}>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-inner border border-white/20">
                {localOffline ? <Lock size={40} className="text-white"/> : <Utensils size={40} className="text-white"/>}
            </div>
          </div>
          
          {/* 🟢 NOME ATUALIZADO */}
          <h1 className="text-3xl font-bold text-white tracking-tight">Nexus OS</h1>
          <p className="text-blue-100 text-sm mt-2 opacity-90">
            {localOffline ? 'Modo de Contingência (Local)' : 'Sistema Operacional Conectado'}
          </p>
        </div>

        {/* Status da Rede Inteligente */}
        <div className={`px-6 py-2 flex items-center justify-between text-xs font-medium ${localOffline ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>
            <div className="flex items-center gap-2">
                {localOffline ? <WifiOff size={14}/> : <Wifi size={14}/>}
                <span>{localOffline ? 'Operando Offline' : 'Conexão Estável'}</span>
            </div>
            
            {/* Botão de Re-checagem Manual */}
            <button 
                onClick={checkRealConnection}
                disabled={checkingNet}
                className={`flex items-center gap-1 hover:underline ${checkingNet ? 'opacity-50' : ''}`}
                type="button"
            >
                <RefreshCw size={12} className={checkingNet ? 'animate-spin' : ''}/>
                {checkingNet ? 'Verificando...' : 'Verificar Rede'}
            </button>
        </div>

        {/* Formulário */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <FormField label="Email Corporativo">
                <div className="relative group">
                    <Mail className="absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="acesso@nexus.com"
                        required
                        disabled={submitting}
                    />
                </div>
            </FormField>

            <FormField label={localOffline ? "PIN de Acesso" : "Senha"}>
                <div className="relative group">
                    <Lock className="absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="••••••"
                        required
                        disabled={submitting}
                    />
                </div>
            </FormField>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                    {error}
                </div>
            )}

            <button 
                type="submit" 
                disabled={submitting}
                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] 
                    ${localOffline 
                        ? 'bg-gray-800 shadow-gray-500/30 hover:bg-gray-700' 
                        : 'bg-blue-600 shadow-blue-500/30 hover:bg-blue-700'}
                    disabled:opacity-70 disabled:cursor-wait flex justify-center items-center gap-2`}
            >
                {submitting ? (
                    <>
                        <Loader className="animate-spin" size={20} />
                        <span>Autenticando...</span>
                    </>
                ) : (
                    <span>{localOffline ? 'Entrar Offline' : 'Acessar Sistema'}</span>
                )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
                Nexus OS v12.0 &bull; {localOffline ? 'Modo Alta Performance' : 'Sincronização em Tempo Real'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};