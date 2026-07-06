"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, FileText } from "lucide-react";
import { CitationItem } from "@/services/public_chat";

interface MessageCitationsProps {
  citations?: CitationItem[];
}

export default function MessageCitations({ citations }: MessageCitationsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-2 border-t border-slate-800/40 pt-2 shrink-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition duration-150 outline-none cursor-pointer"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-550/80 animate-pulse" />
        {citations.length} {citations.length === 1 ? "Source" : "Sources"} used
        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {isExpanded && (
        <div className="mt-1.5 space-y-1 max-h-[140px] overflow-y-auto pr-1">
          {citations.map((cite, idx) => {
            const isUrl = cite.source_type === "url" || cite.url;
            return (
              <div
                key={cite.source_id || idx}
                className="flex items-center justify-between gap-2 bg-slate-900/50 border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-300 transition hover:border-slate-700/80"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="truncate font-medium text-slate-300">{cite.source_name}</span>
                </div>
                {isUrl && cite.url && (
                  <a
                    href={cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 transition shrink-0 flex items-center gap-0.5 font-medium"
                  >
                    View <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
