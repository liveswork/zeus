// src/components/business/modules/whatsapp/WhatsappManager.tsx

import React, { useState, useEffect } from "react";
import { db, functions } from "../../../../config/firebase";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  PlusCircle,
  Trash2,
  MessageSquare,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useUI } from "../../../../contexts/UIContext";
import { Modal } from "../../../ui/Modal";
import { FormField } from "../../../ui/FormField";
import QRCode from "react-qr-code";
import { httpsCallable } from "firebase/functions";
import { toast } from "react-hot-toast";

// --- Tipagem para os dados de conexão ---
interface WhatsappConnection {
  id: string;
  nickname: string;
  phoneNumber?: string;
  status: "connecting" | "connected" | "disconnected" | "error";
  qrCode?: string;
  lastStatus?: string;
}

// --- Funções do Firebase ---
const startWhatsappSessionCall = httpsCallable(
  functions,
  "startWhatsappSession"
);
const logoutWhatsappSessionCall = httpsCallable(
  functions,
  "logoutWhatsappSession"
);

// --- Componente do Modal para Conectar com QR Code ---
interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
}

const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  businessId,
}) => {
  const { userProfile } = useAuth();
  const [nickname, setNickname] = useState("");
  const [connection, setConnection] = useState<WhatsappConnection | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setConnection(null);
      setNickname("");
    }
  }, [isOpen]);

  const handleStartConnection = async () => {
    if (!nickname.trim()) {
      toast.error("Por favor, dê um apelido para esta conexão.");
      return;
    }

    if (!userProfile) {
      toast.error("Você precisa estar logado para iniciar a conexão.");
      return;
    }

    setLoading(true);

    try {
      const result = await startWhatsappSessionCall({
        businessId: userProfile.businessId,
        nickname,
      });

      const connectionId = result.data.connectionId;

      if (!connectionId) {
        throw new Error("Não foi possível iniciar a sessão de conexão.");
      }

      // Escuta o documento recém-criado no Firestore
      const unsub = onSnapshot(
        doc(
          db,
          "users",
          userProfile.businessId,
          "whatsapp_connections",
          connectionId
        ),
        (docSnap) => {
          const data = docSnap.data() as WhatsappConnection;
          setConnection({ id: docSnap.id, ...data });

          if (data.status === "connected") {
            toast.success(
              `Número ${data.phoneNumber} conectado com sucesso!`
            );
            unsub(); // Para de ouvir
            onClose();
          }
        }
      );
    } catch (error: any) {
      console.error("[WhatsappManager] Erro ao iniciar conexão:", error);
      toast.error(error.message || "Erro ao iniciar a conexão no servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Conectar Novo Número de WhatsApp"
    >
      <div className="p-4 text-center">
        {!connection ? (
          <div className="space-y-4">
            <FormField
              label="Apelido para esta conexão"
              tooltip="Ex: Vendas Loja, Suporte Matriz"
            >
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </FormField>
            <button
              onClick={handleStartConnection}
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg"
            >
              {loading ? "Iniciando sessão..." : "Gerar QR Code"}
            </button>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col items-center">
            <h3 className="font-bold">Escaneie com seu celular</h3>
            <p className="text-sm text-gray-600">
              No seu WhatsApp, vá em Aparelhos Conectados {'>'} Conectar um
              aparelho.
            </p>

            {connection.status === "connecting" && connection.qrCode ? (
              <div className="p-4 bg-white inline-block rounded-lg shadow-md">
                <QRCode value={connection.qrCode} size={256} />
              </div>
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                <RefreshCw className="animate-spin text-gray-500" size={48} />
              </div>
            )}
            <p className="font-semibold text-blue-600">
              {connection.lastStatus || "Aguardando leitura do QR Code..."}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

// --- Componente Principal ---
export const WhatsappManager = () => {
  const { userProfile } = useAuth();
  const { showConfirmation } = useUI();
  const [connections, setConnections] = useState<WhatsappConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const businessId = userProfile?.businessId;

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    const connectionsRef = collection(
      db,
      "users",
      businessId,
      "whatsapp_connections"
    );
    const unsubscribe = onSnapshot(connectionsRef, (snapshot) => {
      const connectionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as WhatsappConnection[];
      setConnections(connectionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [businessId]);

  const handleLogout = async (connectionId: string) => {
    showConfirmation({
      title: "Desconectar Sessão?",
      message:
        "Isso irá deslogar o número do nosso sistema. Você precisará escanear um novo QR Code para reconectar.",
      onConfirm: async () => {
        if (!businessId) return;
        try {
          await logoutWhatsappSessionCall({ businessId, connectionId });
          toast.success("Sessão desconectada.");
        } catch (error) {
          toast.error("Erro ao tentar desconectar.");
          const docRef = doc(
            db,
            "users",
            businessId,
            "whatsapp_connections",
            connectionId
          );
          await updateDoc(docRef, { status: "disconnected", qrCode: null });
        }
      },
    });
  };

  const handleDelete = async (connectionId: string) => {
    showConfirmation({
      title: "Confirmar Exclusão",
      message:
        "Tem certeza que deseja remover esta conexão permanentemente? O histórico de conversas não será afetado.",
      onConfirm: async () => {
        if (!businessId) return;
        await deleteDoc(
          doc(db, "users", businessId, "whatsapp_connections", connectionId)
        );
      },
    });
  };

  if (loading) return <div>Carregando conexões...</div>;
  if (!businessId)
    return <div className="text-red-500">ID do negócio não encontrado.</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Conexões do WhatsApp
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-blue-700 transition"
        >
          <PlusCircle size={20} className="mr-2" />
          Conectar Novo Número
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Números Conectados</h2>
        {connections.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Nenhum número de WhatsApp conectado ainda.
          </p>
        ) : (
          <div className="space-y-4">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg hover:bg-gray-50 gap-4"
              >
                <div className="flex items-center gap-4">
                  <MessageSquare
                    className={`w-8 h-8 ${
                      conn.status === "connected" ? "text-green-500" : "text-gray-400"
                    }`}
                  />
                  <div>
                    <p className="font-bold text-lg text-gray-800">{conn.nickname}</p>
                    <p className="text-sm text-gray-600">
                      {conn.phoneNumber || "Aguardando conexão..."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end md:self-center">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      conn.status === "connected"
                        ? "bg-green-100 text-green-800"
                        : conn.status === "connecting"
                        ? "bg-yellow-100 text-yellow-800 animate-pulse"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {conn.status}
                  </span>
                  {conn.status === "connected" && (
                    <button
                      onClick={() => handleLogout(conn.id)}
                      title="Desconectar Sessão"
                      className="text-yellow-600 hover:text-yellow-800 p-2 rounded-full hover:bg-yellow-100"
                    >
                      <LogOut size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(conn.id)}
                    title="Remover Conexão"
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConnectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        businessId={businessId}
      />
    </div>
  );
};
