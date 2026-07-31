import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, newContent: string) => void;
  toggleChat: () => void;
  clearChat: () => void;
  fetchChatHistory: (sceneId: number, token: string) => Promise<void>;
  clearChatHistory: (sceneId: number, token: string) => Promise<void>;
  
  // Phase 21 settings
  persona: string;
  setPersona: (persona: string) => void;
  contextSettings: {
    include_archivum: boolean;
    include_manuscript: boolean;
    include_beats: boolean;
  };
  setContextSetting: (key: 'include_archivum' | 'include_manuscript' | 'include_beats', value: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isOpen: false,
  persona: 'cowriter',
  contextSettings: {
    include_archivum: true,
    include_manuscript: true,
    include_beats: true
  },
  
  setPersona: (persona) => set({ persona }),
  setContextSetting: (key, value) => set((state) => ({
    contextSettings: { ...state.contextSettings, [key]: value }
  })),
  
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, msg]
  })),
  
  updateMessage: (id, newContent) => set((state) => ({
    messages: state.messages.map((m) => 
      m.id === id ? { ...m, content: newContent } : m
    )
  })),
  
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  
  clearChat: () => set({ messages: [] }),

  fetchChatHistory: async (sceneId: number, token: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/ai/chat/${sceneId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.map((msg: any) => ({
          id: msg.id.toString(),
          role: msg.role,
          content: msg.content
        }));
        set({ messages: formattedMessages });
      }
    } catch (e) {
      console.error("Failed to fetch chat history", e);
    }
  },

  clearChatHistory: async (sceneId: number, token: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/ai/chat/${sceneId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        set({ messages: [] });
      }
    } catch (e) {
      console.error("Failed to clear chat history", e);
    }
  }
}));
