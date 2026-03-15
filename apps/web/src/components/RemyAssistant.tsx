import { useEffect, useRef, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { PaperPlaneRight, X, ChefHat, Cookie } from "@phosphor-icons/react";
import { Streamdown } from "streamdown";

import { useConferenceChat } from "#/lib/conference-ai-hook";
import type { ConferenceChatMessages } from "#/lib/conference-ai-hook";
import { showRemyAssistant } from "#/lib/ui-stores";

function Messages({ messages }: { messages: ConferenceChatMessages }) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/60 text-sm px-6 py-8">
      <div className="relative mb-4">
        <ChefHat className="w-12 h-12 text-primary/60 animate-pulse" />
        <Cookie className="w-6 h-6 text-secondary/60 absolute -bottom-1 -right-1" />
      </div>
      <p className="text-center text-foreground font-medium font-display text-lg">
        Bonjour! I'm Remy 👨‍🍳
      </p>
      <p className="text-xs text-muted-foreground mt-2 text-center max-w-55">
        Your culinary guide to Haute Pâtisserie 2026. Ask about speakers, sessions, or pastry
        techniques!
      </p>
    </div>
  );

  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
      {messages.map(({ id, role, parts }) => (
        <div
          key={id}
          className={`py-3 ${role === "assistant" ? "bg-secondary/5" : "bg-transparent"}`}
        >
          {parts.map((part, index) => {
            if (part.type === "text" && part.content) {
              return (
                <div key={index} className="flex items-start gap-3 px-4">
                  {role === "assistant" ? (
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0 shadow-lg shadow-primary/20">
                      👨‍🍳
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0 border border-border/50">
                      You
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-foreground prose dark:prose-invert max-w-none prose-sm prose-p:text-foreground prose-headings:text-foreground prose-strong:text-secondary">
                    <Streamdown>{part.content}</Streamdown>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      ))}
    </div>
  );
}

interface RemyAssistantProps {
  speakerSlug?: string;
  talkSlug?: string;
  contextTitle?: string;
}

export default function RemyAssistant({ speakerSlug, talkSlug, contextTitle }: RemyAssistantProps) {
  const isOpen = useStore(showRemyAssistant, (state) => state);
  const { messages, sendMessage, isLoading } = useConferenceChat(speakerSlug, talkSlug);
  const [input, setInput] = useState("");

  const handleToggle = () => {
    showRemyAssistant.setState((prev) => !prev);
  };

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-20 right-6 z-100 w-100 h-130 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border/50 backdrop-blur-2xl bg-card/98">
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-primary/10 via-secondary/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between p-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 rotate-3 hover:rotate-0 transition-transform">
            <span className="text-lg">👨‍🍳</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground text-base tracking-tight">
              Remy
            </h3>
            {contextTitle && (
              <p className="text-xs text-muted-foreground truncate max-w-55">🥐 {contextTitle}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleToggle}
          className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-accent rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <Messages messages={messages} />

      {/* Loading indicator */}
      {isLoading && (
        <div className="px-4 py-3 border-t border-border/30">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
            </div>
            <span className="font-medium">Crafting a response...</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="relative p-4 border-t border-border/30 bg-accent/30">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about speakers, sessions, techniques..."
              disabled={isLoading}
              className="w-full rounded-xl border border-border bg-background pl-4 pr-12 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent resize-none overflow-hidden disabled:opacity-50 transition-all"
              rows={1}
              style={{ minHeight: "48px", maxHeight: "100px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 100) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && input.trim() && !isLoading) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 disabled:bg-muted transition-all hover:shadow-lg hover:shadow-primary/20"
            >
              <PaperPlaneRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
