import { useState, useEffect, useRef, useCallback } from "react";
import { CitationItem } from "@/services/public_chat";

export interface StreamMessage {
  id?: string;
  sender: "user" | "bot";
  content: string;
  time?: string;
  citations?: CitationItem[];
  escalation_eligible?: boolean;
}

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "https://chatbot-proxy.subodhconfluxaa.workers.dev/api/v1";
const API_URL = rawApiUrl.replace(/^['"]|['"]$/g, "").trim();

export function useChatStream(conversationId: string | null, initialWelcomeMessage?: string) {
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Track message updates to append streaming tokens in-place
  const messagesRef = useRef<StreamMessage[]>([]);
  messagesRef.current = messages;

  // Initialize welcome message
  useEffect(() => {
    if (initialWelcomeMessage) {
      setMessages([
        {
          sender: "bot",
          content: initialWelcomeMessage,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [initialWelcomeMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.onclose = null; // prevent auto-reconnect
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!conversationId) return;

    disconnect();

    const wsBase = API_URL.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
    const wsUrl = `${wsBase}/ws/${conversationId}`;

    console.log("[useChatStream] Connecting WebSocket:", wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("[useChatStream] Connection established.");
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.event === "typing") {
            setIsTyping(data.state === true);
          } else if (data.event === "stream_start") {
            setIsStreaming(true);
            setIsTyping(false);
            // Append a new empty bot message bubble to accumulate text
            setMessages((prev) => [
              ...prev,
              {
                sender: "bot",
                content: "",
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ]);
          } else if (data.event === "stream_chunk") {
            // Update the last message content by appending the incoming text chunk
            setMessages((prev) => {
              if (prev.length === 0) return prev;
              const next = [...prev];
              const lastIdx = next.length - 1;
              if (next[lastIdx].sender === "bot") {
                next[lastIdx] = {
                  ...next[lastIdx],
                  content: next[lastIdx].content + data.text,
                };
              }
              return next;
            });
          } else if (data.event === "stream_end") {
            setIsStreaming(false);
            // Attach final payload fields like citations and escalation eligibility to the last bot message
            setMessages((prev) => {
              if (prev.length === 0) return prev;
              const next = [...prev];
              const lastIdx = next.length - 1;
              if (next[lastIdx].sender === "bot") {
                next[lastIdx] = {
                  ...next[lastIdx],
                  citations: data.citations || [],
                  escalation_eligible: data.escalation_eligible || false,
                };
              }
              return next;
            });
          }
        } catch (parseErr) {
          console.warn("[useChatStream] Failed to parse WebSocket message:", event.data, parseErr);
        }
      };

      ws.onclose = (event) => {
        console.log("[useChatStream] Connection closed:", event);
        setIsConnected(false);
        
        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          console.log(`[useChatStream] Reconnecting in ${delay}ms... (Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setError("Connection lost. Real-time updates are currently unavailable.");
        }
      };

      ws.onerror = (err) => {
        console.error("[useChatStream] WebSocket error:", err);
      };
    } catch (err) {
      console.error("[useChatStream] Failed to initialize WebSocket:", err);
      setError("Failed to establish real-time connection.");
    }
  }, [conversationId, disconnect]);

  // Connect WebSocket on mount or when conversationId changes
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [conversationId, connect, disconnect]);

  const sendMessage = useCallback((content: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn("[useChatStream] WebSocket is not connected. Message cannot be sent.");
      return false;
    }

    // Add user message to UI state locally first
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        content,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    setIsTyping(true);
    socketRef.current.send(JSON.stringify({ content }));
    return true;
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        sender: "bot",
        content: initialWelcomeMessage || "Welcome!",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [initialWelcomeMessage]);

  return {
    messages,
    setMessages,
    sendMessage,
    clearMessages,
    isTyping,
    isStreaming,
    isConnected,
    error,
  };
}
