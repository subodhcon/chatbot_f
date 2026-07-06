"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Loader2, Calendar, Bot as BotIcon, User } from "lucide-react";
import { conversationService, Conversation, Message } from "@/services/conversation";

export default function ConversationsPage() {
  const searchParams = useSearchParams();
  const botFilter = searchParams ? searchParams.get("bot") : null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConversationsLoading, setIsConversationsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);

  // Fetch all conversation sessions
  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await conversationService.getConversations(botFilter || undefined);
        if (res.success && res.data) {
          setConversations(res.data);
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setIsConversationsLoading(false);
      }
    }
    fetchConversations();
  }, [botFilter]);

  // Fetch transcripts when a conversation is clicked
  const handleSelectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    setIsMessagesLoading(true);
    setMessages([]);
    try {
      const res = await conversationService.getConversationMessages(conv.id);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setIsMessagesLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Conversations</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Monitor real-time chatbot logs, conversation flow, and message history.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: list of sessions */}
        <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">Recent Sessions</h2>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-850 overflow-y-auto flex-1">
            {isConversationsLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                <MessageSquare className="h-8 w-8 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-900 dark:text-white">No active sessions</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[180px]">
                  Logs will populate once users start chatting with your bots.
                </p>
              </div>
            ) : (
              conversations.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleSelectConversation(chat)}
                  className={`flex items-center justify-between p-4 cursor-pointer transition ${
                    selectedConversation?.id === chat.id
                      ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-l-4 border-indigo-600"
                      : "hover:bg-slate-50/50 dark:hover:bg-slate-950/10 border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden min-w-0">
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {chat.user_identifier}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-450 truncate">
                        Bot: <span className="font-semibold text-indigo-500 dark:text-indigo-400">{chat.bot_name || "Unknown"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      {chat.messages_count} msgs
                    </span>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {formatTime(chat.updated_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: active transcript window */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col h-[600px]">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedConversation.user_identifier}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <BotIcon className="h-3 w-3 text-indigo-500" /> Handled by: <span className="font-semibold">{selectedConversation.bot_name}</span>
                    </span>
                    <span className="text-slate-300 dark:text-slate-800">•</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <Calendar className="h-3 w-3" /> Started: {formatTime(selectedConversation.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages Content */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/20 dark:bg-slate-950/10">
                {isMessagesLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isBot = msg.sender === "bot";
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-[85%] ${
                          isBot ? "mr-auto" : "ml-auto flex-row-reverse"
                        }`}
                      >
                        <div
                          className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-xs ${
                            isBot
                              ? "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350"
                          }`}
                        >
                          {isBot ? <BotIcon className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                        </div>
                        <div>
                          <div
                            className={`rounded-2xl px-4 py-2 text-xs leading-relaxed ${
                              isBot
                                ? "bg-white border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-250 rounded-tl-none"
                                : "bg-indigo-600 text-white rounded-tr-none"
                            }`}
                          >
                            <p className="whitespace-pre-line">{msg.content}</p>
                          </div>
                          <span className="block text-[8px] text-slate-400 mt-1 pl-1">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="h-12 w-12 text-slate-350 dark:text-slate-650 mb-3" />
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Select a conversation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                Choose a session from the list on the left to read full transcript logs and analyze responses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
