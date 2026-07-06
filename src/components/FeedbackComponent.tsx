"use client";

import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, Send, Loader2, Check } from "lucide-react";
import { publicChatService } from "@/services/public_chat";

interface FeedbackComponentProps {
  conversationId: string;
  messageId: string;
}

export default function FeedbackComponent({
  conversationId,
  messageId,
}: FeedbackComponentProps) {
  const [rating, setRating] = useState<"thumbs_up" | "thumbs_down" | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  const submitRating = async (selectedRating: "thumbs_up" | "thumbs_down", currentText: string) => {
    setIsSubmitting(true);
    setSaveStatus("idle");
    try {
      const res = await publicChatService.submitFeedback(
        conversationId,
        messageId,
        selectedRating,
        currentText.trim() || undefined
      );

      if (res.success) {
        setSaveStatus("saved");
        // Clear status text after 3 seconds
        setTimeout(() => {
          setSaveStatus("idle");
        }, 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      console.error("Failed to submit feedback", err);
      setSaveStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = async (selectedRating: "thumbs_up" | "thumbs_down") => {
    if (isSubmitting) return;
    
    setRating(selectedRating);
    setShowTextInput(true);
    
    // Automatically submit/update the rating immediately
    await submitRating(selectedRating, feedbackText);
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || isSubmitting) return;
    await submitRating(rating, feedbackText);
  };

  return (
    <div className="mt-2 text-slate-400 flex flex-col gap-2 animate-in fade-in duration-200">
      {/* Thumbs Buttons Row */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-slate-500 font-medium">Was this helpful?</span>
        <div className="flex items-center gap-1 bg-slate-900/30 rounded-lg p-0.5 border border-slate-800/40">
          <button
            type="button"
            onClick={() => handleRatingClick("thumbs_up")}
            disabled={isSubmitting}
            className={`p-1 rounded transition-all active:scale-90 cursor-pointer ${
              rating === "thumbs_up"
                ? "bg-indigo-600 text-white border border-indigo-500/20"
                : "hover:bg-slate-800 hover:text-indigo-400"
            }`}
            title="Helpful"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleRatingClick("thumbs_down")}
            disabled={isSubmitting}
            className={`p-1 rounded transition-all active:scale-90 cursor-pointer ${
              rating === "thumbs_down"
                ? "bg-red-650/80 text-white border border-red-500/20"
                : "hover:bg-slate-800 hover:text-red-400"
            }`}
            title="Not helpful"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Status Indicator */}
        {saveStatus === "saved" && (
          <span className="text-[9px] text-emerald-400 flex items-center gap-1 animate-in fade-in duration-300">
            <Check className="h-2.5 w-2.5" /> Saved
          </span>
        )}
        {saveStatus === "error" && (
          <span className="text-[9px] text-red-400 animate-in fade-in duration-300">
            Error saving feedback
          </span>
        )}
      </div>

      {/* Optional Feedback Text Form */}
      {showTextInput && (
        <form
          onSubmit={handleTextSubmit}
          className="flex flex-col gap-1.5 bg-slate-900/40 border border-slate-800/60 rounded-xl p-2 max-w-[280px] w-full animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <div className="flex gap-1.5 items-center">
            <input
              type="text"
              placeholder="What could be improved? (optional)"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="flex-1 bg-slate-950/70 border border-slate-800/80 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 placeholder-slate-600 outline-none focus:border-slate-700 transition"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:scale-100 p-1.5 rounded-lg text-white transition flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-50"
              title="Submit text feedback"
            >
              {isSubmitting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
