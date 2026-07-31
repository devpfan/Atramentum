import React, { useState, useRef, useEffect } from 'react';
import { useChatStore, type ChatMessage } from '../../store/useChatStore';
import { useAppStore } from '../../store/useAppStore';
import { Send, X, Bot, User, Trash2, Settings } from 'lucide-react';
import { useManuscriptStore } from '../../store/useManuscriptStore';
import { aiApi, type AiSettings } from '../../api/ai';
import AiSettingsModal from './AiSettingsModal';

export default function AssistantChat() {
  const isOpen = useChatStore(state => state.isOpen);
  const toggleChat = useChatStore(state => state.toggleChat);
  const { messages, fetchChatHistory, clearChatHistory, addMessage, updateMessage, persona, setPersona, contextSettings, setContextSetting } = useChatStore();
  const token = useAppStore(state => state.token);
  const activeSceneId = useManuscriptStore(state => state.activeSceneId);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const SCENE_ID = activeSceneId || 0; // Si no hay escena activa, usamos la 0 (global)

  const loadSettings = async () => {
    try {
      const data = await aiApi.getSettings();
      setAiSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Cargar historial al abrir o cambiar de escena
  useEffect(() => {
    if (isOpen && token) {
      fetchChatHistory(SCENE_ID, token);
      loadSettings();
    }
  }, [isOpen, SCENE_ID, token, fetchChatHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleClear = () => {
    if (confirm('¿Estás seguro de vaciar el historial de este chat?')) {
      if (token) clearChatHistory(SCENE_ID, token);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };
    
    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    addMessage({ id: botMessageId, role: 'assistant', content: '' });

    try {
      const baseUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api/v1`;
      const response = await fetch(`${baseUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          scene_id: SCENE_ID,
          persona: persona,
          context_settings: contextSettings
        })
      });

      if (!response.body) throw new Error('No body in response');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        currentText += decoder.decode(value, { stream: true });
        updateMessage(botMessageId, currentText);
      }
    } catch (error) {
      console.error('Error en el chat:', error);
      updateMessage(botMessageId, 'Hubo un error al procesar tu solicitud. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-80 h-full bg-[var(--color-background)] border-l border-[var(--color-border)] flex flex-col shadow-xl z-20 transition-all duration-300">
      {/* Header */}
      <div className="h-14 border-b border-[var(--color-border)] flex items-center justify-between px-4 bg-[var(--color-background)]/95 backdrop-blur shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-blue-400" />
          <h3 className="text-sm font-medium text-[var(--color-text-primary)]">AtrIA</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowSettings(!showSettings)} title="Ajustes de IA" className={`p-1.5 rounded text-[var(--color-text-secondary)] hover:text-blue-400 hover:bg-blue-500/10 transition-colors ${showSettings ? 'text-blue-400 bg-blue-500/10' : ''}`}>
            <Settings size={16} />
          </button>
          <button onClick={handleClear} title="Vaciar chat" className="p-1.5 rounded text-[var(--color-text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 size={16} />
          </button>
          <button onClick={toggleChat} className="p-1.5 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors ml-1">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] p-4 text-sm flex flex-col gap-4">
          <div>
            <label className="block text-xs text-[var(--color-text-secondary)] mb-1 uppercase tracking-wider">Rol (Personalidad)</label>
            <select 
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <optgroup label="Roles Nativos">
                <option value="cowriter">Co-Escritor (Ayuda Creativa)</option>
                <option value="critic">El Crítico (Analítico y Severo)</option>
                <option value="reader">Lector de Prueba (Fan / Reacciones)</option>
                <option value="editor">Editor (Estilo, Gramática y Tono)</option>
              </optgroup>
              {aiSettings?.custom_personas && aiSettings.custom_personas.length > 0 && (
                <optgroup label="Mis Roles (Personales)">
                  {aiSettings.custom_personas.map(p => (
                    <option key={p.id} value={p.id}>🤖 {p.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
            <button 
              onClick={() => setShowPersonaModal(true)} 
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors block text-right w-full"
            >
              Gestionar Mis Roles...
            </button>
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">Contexto a incluir</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={contextSettings.include_archivum}
                  onChange={(e) => setContextSetting('include_archivum', e.target.checked)}
                  className="rounded border-[var(--color-border)] bg-[var(--color-background)] text-blue-500"
                />
                <span className="text-[var(--color-text-primary)] text-sm">Archivum (Personajes, Lugares)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={contextSettings.include_manuscript}
                  onChange={(e) => setContextSetting('include_manuscript', e.target.checked)}
                  className="rounded border-[var(--color-border)] bg-[var(--color-background)] text-blue-500"
                />
                <span className="text-[var(--color-text-primary)] text-sm">Escenas Relevantes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={contextSettings.include_beats}
                  onChange={(e) => setContextSetting('include_beats', e.target.checked)}
                  className="rounded border-[var(--color-border)] bg-[var(--color-background)] text-blue-500"
                />
                <span className="text-[var(--color-text-primary)] text-sm">Beats (Escena actual)</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-text-secondary)] opacity-50 space-y-3">
            <Bot size={32} />
            <p className="text-sm">Hola, soy tu asistente de escritura. ¿En qué puedo ayudarte hoy?</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-500/10 text-blue-100 rounded-tr-none' : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-tl-none border border-[var(--color-border)]'}`}>
              {msg.content || <span className="animate-pulse">...</span>}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]/50 shrink-0">
        <form onSubmit={handleSend} className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregúntame sobre la historia..."
            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none h-[52px] min-h-[52px] max-h-[120px]"
            disabled={isLoading}
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-1.5 text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:hover:text-blue-400 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
      
      {showPersonaModal && (
        <AiSettingsModal onClose={() => setShowPersonaModal(false)} onSaved={loadSettings} />
      )}
    </div>
  );
}
