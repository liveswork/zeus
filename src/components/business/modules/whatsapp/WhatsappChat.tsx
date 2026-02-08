// src/components/business/modules/whatsapp/WhatsappChat.tsx
import React from 'react';
import { MessageSquare, Send, Paperclip } from 'lucide-react';

// --- Componente de Placeholder para quando nenhuma conversa está selecionada ---
const NoChatSelected = () => (
  <div className="flex flex-col h-full items-center justify-center bg-gray-100 text-center p-8">
    <MessageSquare size={80} className="text-gray-300" />
    <h2 className="mt-4 text-2xl font-semibold text-gray-600">Seu WhatsApp no FoodPDV</h2>
    <p className="mt-2 text-gray-500">Selecione uma conversa na lista à esquerda para começar a responder seus clientes diretamente por aqui.</p>
  </div>
);

// --- Componente da Janela de Chat Ativa ---
const ChatWindow = () => {
    // No futuro, aqui virão os dados da conversa selecionada
    return (
        <div className="flex flex-col h-full">
            {/* Header da Conversa */}
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b bg-white">
                <div>
                    <h3 className="font-bold text-gray-800">Nome do Cliente</h3>
                    <p className="text-xs text-gray-500">+55 85 91234-5678</p>
                </div>
                {/* Futuros botões de ação (ex: ver perfil do cliente) */}
            </header>

            {/* Corpo das Mensagens */}
            <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {/* Aqui faremos um map nas mensagens */}
                <p className="text-center text-gray-400">Histórico de mensagens aparecerá aqui.</p>
            </main>

            {/* Input de Nova Mensagem */}
            <footer className="flex-shrink-0 p-4 bg-white border-t">
                <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-500 hover:text-blue-600">
                        <Paperclip size={22} />
                    </button>
                    <input
                        type="text"
                        placeholder="Digite uma mensagem..."
                        className="flex-1 p-3 border rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                        <Send size={22} />
                    </button>
                </div>
            </footer>
        </div>
    );
}

// --- Componente Principal da Tela de Chat ---
export const WhatsappChat = () => {
  // Por enquanto, os dados são estáticos. Na próxima fase, eles virão do Firestore.
  const conversations = [
    { id: 1, name: "Cliente Teste 1", lastMessage: "Olá, gostaria de fazer um pedido...", unread: 2 },
    { id: 2, name: "Maria Silva", lastMessage: "Qual o valor da entrega?", unread: 0 },
  ];
  const selectedChatId = null; // No futuro, isso será um estado

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Coluna da Esquerda: Lista de Conversas */}
      <aside className="w-1/3 border-r flex flex-col">
        <header className="p-4 border-b">
          <input type="search" placeholder="Pesquisar ou começar uma nova conversa" className="w-full p-2 border rounded-lg bg-gray-100" />
        </header>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(chat => (
            <div key={chat.id} className="flex items-center p-4 border-b hover:bg-gray-50 cursor-pointer">
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{chat.name}</p>
                <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 && (
                <span className="bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {chat.unread}
                </span>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Coluna da Direita: Conversa Ativa ou Placeholder */}
      <main className="w-2/3">
        {selectedChatId ? <ChatWindow /> : <NoChatSelected />}
      </main>
    </div>
  );
};             