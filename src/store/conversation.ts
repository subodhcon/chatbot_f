import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Conversation, Message } from "@/services/conversation";

interface ConversationState {
  activeConversation: Conversation | null;
  messages: Message[];
  isTyping: boolean;
  connectionState: "connected" | "disconnected" | "connecting";

  // Actions
  setActiveConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setTyping: (isTyping: boolean) => void;
  setConnectionState: (state: "connected" | "disconnected" | "connecting") => void;
  clearStore: () => void;
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set) => ({
      activeConversation: null,
      messages: [],
      isTyping: false,
      connectionState: "disconnected",

      setActiveConversation: (conversation) => set({ activeConversation: conversation }),
      setMessages: (messages) => set({ messages }),
      addMessage: (message) =>
        set((state) => {
          // Avoid duplicate messages
          if (state.messages.some((m) => m.id === message.id)) {
            return state;
          }
          return { messages: [...state.messages, message] };
        }),
      setTyping: (isTyping) => set({ isTyping }),
      setConnectionState: (connectionState) => set({ connectionState }),
      clearStore: () =>
        set({
          activeConversation: null,
          messages: [],
          isTyping: false,
          connectionState: "disconnected",
        }),
    }),
    {
      name: "conversation-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist activeConversation. Typing state and connection state are transient.
      partialize: (state) => ({
        activeConversation: state.activeConversation,
      }),
    }
  )
);
