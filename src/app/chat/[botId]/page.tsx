"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Bot, Send, Loader2, AlertCircle, PhoneCall, Menu, Trash2, Info, Calendar, Briefcase, Layers, LayoutGrid, Monitor, Cloud, Eye, Cpu, Gamepad2, Shield, MessageSquare, Mail, User, Users } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { publicChatService, PublicBot, CitationItem } from "@/services/public_chat";
import MessageCitations from "@/components/MessageCitations";
import FeedbackComponent from "@/components/FeedbackComponent";

export default function GuestChatPage() {
  const params = useParams();
  const botId = params?.botId as string;

  const [bot, setBot] = useState<PublicBot | null>(null);
  const [messages, setMessages] = useState<Array<{ id?: string; sender: string; content: string; time?: string; citations?: CitationItem[]; escalation_eligible?: boolean }>>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // UI states
  const [inputMessage, setInputMessage] = useState("");
  const [isLoadingBot, setIsLoadingBot] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const connectMenuItems = [
    { label: "Book a Meeting", query: "I want to Book a Meeting", desc: "Schedule a call", icon: Calendar },
    { label: "Careers", query: "Are there any job openings / Careers?", desc: "Join our team", icon: Briefcase }
  ];

  const techServicesMenuItems = [
    { label: "AI & ML Solutions", query: "Tell me about AI & ML Solutions", desc: "Intelligent automation", icon: Layers },
    { label: "Blockchain", query: "Tell me about Blockchain Services", desc: "Web3 solutions", icon: LayoutGrid },
    { label: "Web & Mobile", query: "Tell me about Web & Mobile App Development", desc: "App development", icon: Monitor },
    { label: "Cloud & DevOps", query: "Tell me about Cloud & DevOps Infrastructure Services", desc: "Infrastructure", icon: Cloud },
    { label: "AR/VR & Metaverse", query: "Tell me about AR/VR & Metaverse Services", desc: "Immersive tech", icon: Eye },
    { label: "IoT Solutions", query: "Tell me about IoT Solutions", desc: "Smart devices", icon: Cpu },
    { label: "Game Development", query: "Tell me about Game Development", desc: "Gaming solutions", icon: Gamepad2 },
    { label: "Cybersecurity", query: "Tell me about Cybersecurity Services", desc: "Security services", icon: Shield }
  ];

  const handleClearChat = () => {
    setMessages([
      { sender: "bot", content: bot?.greeting_message || "Welcome! Please state your inquiry so that I may provide assistance.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setConsecutiveFailures(0);
    setMenuOpen(false);
  };

  const formatMessageContent = (text: string) => {
    if (!text) return "";
    
    // Split by newlines
    const lines = text.split("\n");
    let inList = false;
    const formattedLines = [];

    for (let line of lines) {
      let trimmed = line.trim();
      
      // Detect list items
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
        // Strip the list token
        const cleanText = trimmed.replace(/^[\*\-\•]\s+/, "");
        
        // Parse bold markers inside the list item
        const parsedText = cleanText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        
        formattedLines.push(`<li class="ml-4 list-disc pl-1 my-1">${parsedText}</li>`);
      } else {
        // Parse bold markers in normal paragraph text
        const parsedText = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        formattedLines.push(`<p class="my-1 min-h-[1em]">${parsedText}</p>`);
      }
    }

    return formattedLines.join("");
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isReplying]);

  // Load bot public details & initialize conversation
  useEffect(() => {
    if (!botId) return;

    async function initChat() {
      try {
        // 1. Fetch public bot info
        const botRes = await publicChatService.getPublicBot(botId);
        if (!botRes.success || !botRes.data) {
          setError(botRes.error?.message || "Bot not found or inactive.");
          setIsLoadingBot(false);
          return;
        }
        setBot(botRes.data);

        // 2. Initialize conversation session
        // Check if session already exists for this bot in localStorage
        const storageKey = `chat_session_${botId}`;
        const cachedSession = localStorage.getItem(storageKey);
        
        if (cachedSession) {
          const parsed = JSON.parse(cachedSession);
          setConversationId(parsed.conversation_id);
          // Insert initial welcome message
          setMessages([
            { sender: "bot", content: botRes.data.greeting_message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ]);
        } else {
          const browserInfo = typeof window !== "undefined" ? {
            language: navigator.language,
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
          } : undefined;

          const sessionRes = await publicChatService.initializeSession(botId, browserInfo);
          if (sessionRes.success && sessionRes.data) {
            setConversationId(sessionRes.data.conversation_id);
            localStorage.setItem(storageKey, JSON.stringify({
              conversation_id: sessionRes.data.conversation_id,
              user_identifier: sessionRes.data.user_identifier
            }));
            setMessages([
              { sender: "bot", content: sessionRes.data.welcome_message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            ]);
          } else {
            setError(sessionRes.error?.message || "Failed to initialize conversation session.");
          }
        }
      } catch {
        setError("An unexpected error occurred while loading chat.");
      } finally {
        setIsLoadingBot(false);
      }
    }

    initChat();
  }, [botId]);

  const handleQuickQuery = async (queryText: string) => {
    if (!conversationId || isReplying) return;
    setMenuOpen(false);
    
    // Add user message to UI
    setMessages((prev) => [
      ...prev,
      { sender: "user", content: queryText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);

    setIsReplying(true);

    try {
      const res = await publicChatService.sendGuestMessage(conversationId, queryText);
      if (res.success && res.data) {
        const isEscalation = res.data!.escalation_eligible;
        const nextFailures = isEscalation ? consecutiveFailures + 1 : 0;
        setConsecutiveFailures(nextFailures);
        const shouldShowEscalationButton = nextFailures >= 2;

        setMessages((prev) => [
          ...prev,
          { 
            id: res.data!.id,
            sender: "bot", 
            content: res.data!.content, 
            citations: res.data!.citations,
            escalation_eligible: isEscalation && shouldShowEscalationButton,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", content: "Sorry, I encountered an error while processing your request. Please try again." }
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", content: "A connection issue occurred. Please check your network." }
      ]);
    } finally {
      setIsReplying(false);
    }
  };

  // Handle message submission
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !conversationId || isReplying) return;

    const userText = inputMessage.trim();
    setInputMessage("");
    
    // Add user message to UI
    setMessages((prev) => [
      ...prev,
      { sender: "user", content: userText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);

    setIsReplying(true);

    try {
      const res = await publicChatService.sendGuestMessage(conversationId, userText);
      if (res.success && res.data) {
        const isEscalation = res.data!.escalation_eligible;
        const nextFailures = isEscalation ? consecutiveFailures + 1 : 0;
        setConsecutiveFailures(nextFailures);
        const shouldShowEscalationButton = nextFailures >= 2;

        setMessages((prev) => [
          ...prev,
          { 
            id: res.data!.id,
            sender: "bot", 
            content: res.data!.content, 
            citations: res.data!.citations,
            escalation_eligible: isEscalation && shouldShowEscalationButton,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", content: "Sorry, I encountered an error while processing your request. Please try again." }
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", content: "A connection issue occurred. Please check your network." }
      ]);
    } finally {
      setIsReplying(false);
    }
  };

  if (isLoadingBot) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading chat session...</p>
      </div>
    );
  }

  if (error || !bot) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-sm text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Access Error</h3>
          <p className="text-sm text-slate-400 mb-6">{error || "This chatbot is currently offline."}</p>
        </div>
      </div>
    );
  }

  const isLight = bot.extra_config?.widget_theme === "light";
  const widgetColor = bot.extra_config?.widget_color || "#6366f1";
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-0 sm:p-4 md:p-6 transition-all duration-300 relative overflow-hidden"
      style={{
        backgroundColor: isLight ? "#f8fafc" : "#020617",
      }}
    >
      {/* Decorative Premium Mesh Gradients */}
      <div 
        className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none opacity-30 transition-all duration-500"
        style={{
          background: `radial-gradient(circle, ${widgetColor} 0%, transparent 70%)`
        }}
      />
      <div 
        className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none opacity-20 transition-all duration-500"
        style={{
          background: `radial-gradient(circle, ${widgetColor} 0%, transparent 70%)`
        }}
      />

      <div 
        className="max-w-[480px] w-full border sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden h-screen sm:h-[700px] flex flex-col justify-between backdrop-blur-md relative z-10 transition-all"
        style={{
          backgroundColor: isLight ? "rgba(255, 255, 255, 0.9)" : "rgba(15, 23, 42, 0.85)",
          borderColor: isLight ? "rgba(226, 232, 240, 0.8)" : "rgba(30, 41, 59, 0.8)",
          color: isLight ? "#0f172a" : "#ffffff",
        }}
      >
        
        {/* Header */}
        <div 
          className="p-4 border-b flex items-center gap-3 shrink-0 backdrop-blur-md"
          style={{
            backgroundColor: isLight ? "rgba(241, 245, 249, 0.85)" : "rgba(30, 41, 59, 0.7)",
            borderColor: isLight ? "rgba(226, 232, 240, 0.8)" : "rgba(51, 65, 85, 0.6)",
          }}
        >
          <div 
            className="h-11 w-11 rounded-2xl flex items-center justify-center border shrink-0 overflow-hidden shadow-inner"
            style={{
              backgroundColor: `${widgetColor}15`,
              borderColor: `${widgetColor}20`,
              color: widgetColor,
            }}
          >
            {bot.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bot.avatar_url} alt={bot.name} className="h-full w-full object-cover" />
            ) : (
              <Bot className="h-6 w-6" />
            )}
          </div>
          <div className="overflow-hidden flex-1">
            <h2 className="text-sm font-bold tracking-tight truncate" style={{ color: isLight ? "#0f172a" : "#ffffff" }}>{bot.name}</h2>
            <p className="text-[10px] flex items-center gap-1.5 font-medium" style={{ color: isLight ? "#475569" : "#94a3b8" }}>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              Online
            </p>
          </div>
        </div>

        <div 
          className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
          style={{
            backgroundColor: isLight ? "rgba(248, 250, 252, 0.4)" : "rgba(2, 6, 23, 0.4)",
          }}
        >
          <div className="flex-1 mt-auto" />
          {messages.map((msg, i) => {
            const isBot = msg.sender === "bot";
            return (
              <div
                key={i}
                className={`flex gap-3 max-w-[88%] ${
                  isBot ? "mr-auto" : "ml-auto flex-row-reverse"
                } animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] border shadow-sm`}
                  style={{
                    backgroundColor: isBot ? `${widgetColor}15` : (isLight ? "#f1f5f9" : "#1e293b"),
                    borderColor: isBot ? `${widgetColor}25` : (isLight ? "#e2e8f0" : "#334155"),
                    color: isBot ? widgetColor : (isLight ? "#475569" : "#cbd5e1"),
                  }}
                >
                  {isBot ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                </div>
                <div className="flex flex-col">
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed border shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all`}
                    style={
                      isBot
                        ? {
                            backgroundColor: isLight ? "#ffffff" : "#1e293b",
                            borderColor: isLight ? "#e2e8f0" : "#334155",
                            color: isLight ? "#0f172a" : "#cbd5e1",
                            borderTopLeftRadius: 0,
                          }
                        : {
                            background: `linear-gradient(135deg, ${widgetColor} 0%, ${widgetColor}dd 100%)`,
                            borderColor: widgetColor,
                            color: "#ffffff",
                            borderTopRightRadius: 0,
                            boxShadow: `0 4px 14px ${widgetColor}25`
                          }
                    }
                  >
                    <div 
                      className="text-xs leading-relaxed space-y-1.5"
                      dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }}
                    />
                    {isBot && <MessageCitations citations={msg.citations} />}
                    {isBot && msg.id && conversationId && (
                      <FeedbackComponent
                        conversationId={conversationId}
                        messageId={msg.id}
                      />
                    )}
                  </div>
                  {isBot && msg.escalation_eligible && (
                    <div className="mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="border rounded-xl px-3 py-2.5" style={{ backgroundColor: isLight ? "#fffbeb" : "rgba(251, 191, 36, 0.05)", borderColor: isLight ? "#fef3c7" : "rgba(251, 191, 36, 0.15)" }}>
                        <p className="text-[10px] mb-2 font-medium" style={{ color: isLight ? "#b45309" : "#fbbf24" }}>
                          It looks like you might need extra help.
                        </p>
                        <a
                          href="tel:"
                          className="flex items-center gap-1.5 active:scale-95 text-[10px] font-bold px-3 py-1.5 rounded-lg transition w-fit cursor-pointer text-white"
                          style={{
                            backgroundColor: widgetColor,
                          }}
                        >
                          <PhoneCall className="h-3 w-3" />
                          Talk to an Agent
                        </a>
                      </div>
                    </div>
                  )}
                  {msg.time && (
                    <span className="block text-[8px] text-slate-400 dark:text-slate-500 mt-1 pl-1">
                      {msg.time}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isReplying && (
            <div className="flex gap-2.5 max-w-[85%] mr-auto items-center animate-pulse">
              <div 
                className="h-7 w-7 rounded-lg shrink-0 flex items-center justify-center border"
                style={{
                  backgroundColor: `${widgetColor}15`,
                  borderColor: `${widgetColor}25`,
                  color: widgetColor,
                }}
              >
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div 
                className="border rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-1.5 shadow-sm"
                style={{
                  backgroundColor: isLight ? "#ffffff" : "#1e293b",
                  borderColor: isLight ? "#e2e8f0" : "#334155",
                  color: isLight ? "#475569" : "#94a3b8",
                }}
              >
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form 
          onSubmit={handleSendMessage} 
          className="p-3.5 border-t flex gap-2.5 shrink-0 relative backdrop-blur-md"
          style={{
            backgroundColor: isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(15, 23, 42, 0.95)",
            borderColor: isLight ? "rgba(226, 232, 240, 0.8)" : "rgba(51, 65, 85, 0.5)",
          }}
        >
          {/* Rich Glassmorphic Grid Menu Hub (Responsive) */}
          {menuOpen && (
            <div 
              className="absolute bottom-16 left-3 right-3 max-h-[380px] sm:max-h-[440px] overflow-y-auto rounded-3xl border p-4 shadow-2xl backdrop-blur-lg animate-in fade-in slide-in-from-bottom-3 duration-200 z-50 flex flex-col gap-4 text-slate-800 dark:text-slate-200"
              style={{
                backgroundColor: isLight ? "rgba(255, 255, 255, 0.98)" : "rgba(30, 41, 59, 0.98)",
                borderColor: isLight ? "rgba(226, 232, 240, 0.9)" : "rgba(51, 65, 85, 0.8)",
              }}
            >
              {(() => {
                const rawSections = bot.extra_config?.quick_links;
                const sections = Array.isArray(rawSections) && rawSections.length > 0 ? rawSections : [
                  {
                    section_title: "Connect",
                    items: connectMenuItems
                  },
                  {
                    section_title: "Technology Services",
                    items: techServicesMenuItems
                  }
                ];

                return sections.map((section: any, sIdx: number) => (
                  <div key={sIdx}>
                    <h3 className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-2 pl-1">
                      {section.section_title}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Array.isArray(section.items) && section.items.map((item: any, idx: number) => {
                        const Icon = typeof item.icon === "string" 
                          ? ((LucideIcons as any)[item.icon] || LucideIcons.HelpCircle)
                          : (item.icon || LucideIcons.HelpCircle);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleQuickQuery(item.query)}
                            className="flex flex-col items-center text-center p-3 rounded-2xl border transition hover:scale-[1.02] active:scale-95 cursor-pointer shadow-sm hover:shadow"
                            style={{
                              borderColor: isLight ? "#e2e8f0" : "#334155",
                              backgroundColor: isLight ? "#ffffff" : "#1e293b"
                            }}
                          >
                            <div className="h-8 w-8 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${widgetColor}15`, color: widgetColor }}>
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <span className={`text-xs font-bold leading-tight ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>{item.label}</span>
                            <span className={`text-[9px] mt-1 line-clamp-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{item.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}

            </div>
          )}

          {/* Unified Input Pill Wrapper */}
          <div 
            className="flex-1 flex items-center border rounded-2xl pl-2 pr-1 py-1 transition focus-within:ring-2 focus-within:ring-indigo-500/20"
            style={{
              backgroundColor: isLight ? "#f8fafc" : "#020617",
              borderColor: isLight ? "#cbd5e1" : "#334155",
              boxShadow: "none",
            }}
          >
            {/* Left Menu Button (Circular Pill Icon) */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="active:scale-95 h-7 w-7 rounded-xl transition flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800"
                style={{
                  color: isLight ? "#475569" : "#94a3b8",
                  backgroundColor: isLight ? "#e2e8f0" : "#334155",
                }}
              >
                <Menu className="h-3.5 w-3.5" />
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="Type a message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isReplying}
              className="flex-1 bg-transparent px-3 py-1 text-xs placeholder-slate-500 outline-none transition disabled:opacity-50 border-none"
              style={{
                color: isLight ? "#0f172a" : "#f8fafc",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isReplying || !inputMessage.trim()}
            className="active:scale-95 disabled:scale-100 p-2.5 rounded-2xl text-white transition flex items-center justify-center disabled:opacity-50 shrink-0 cursor-pointer shadow-md hover:shadow-lg"
            style={{
              backgroundColor: widgetColor,
            }}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
