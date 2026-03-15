import { useEffect, useRef, useState } from "react";
import { useStore } from "@tanstack/react-store";

import { PaperPlaneRight, X, Robot } from "@phosphor-icons/react";
import { Streamdown } from "streamdown";

import { useGuitarRecommendationChat } from "#/lib/demo-ai-hook";
import type { ChatMessages } from "#/lib/demo-ai-hook";
import { showAIAssistant } from "#/lib/ui-stores";

import GuitarRecommendation from "./demo-GuitarRecommendation";

function Messages({ messages }: { messages: ChatMessages }) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Ask me anything! I'm here to help.
      </div>
    );
  }

  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
      {messages.map(({ id, role, parts }) => (
        <div
          key={id}
          className={`py-4 ${
            role === "assistant" ? "bg-secondary/5 border-y border-secondary/10" : "bg-transparent"
          }`}
        >
          {parts.map((part, index) => {
            if (part.type === "text" && part.content) {
              return (
                <div key={index} className="flex items-start gap-3 px-6">
                  {role === "assistant" ? (
                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0 shadow-lg shadow-primary/20">
                      AI
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 border border-border/50">
                      U
                    </div>
                  )}
                  <div className="flex-1 min-w-0 prose dark:prose-invert max-w-none prose-sm prose-p:text-foreground prose-headings:text-foreground prose-strong:text-secondary">
                    <Streamdown>{part.content}</Streamdown>
                  </div>
                </div>
              );
            }
            if (part.type === "tool-call" && part.name === "recommendGuitar" && part.output) {
              return (
                <div key={part.id} className="max-w-[80%] mx-auto">
                  <GuitarRecommendation id={String(part.output?.id)} />
                </div>
              );
            }
          })}
        </div>
      ))}
    </div>
  );
}

export default function AIAssistant() {
  const isOpen = useStore(showAIAssistant, (state) => state);
  const { messages, sendMessage } = useGuitarRecommendationChat();
  const [input, setInput] = useState("");

  return (
    <div className="relative">
      <button
        onClick={() => showAIAssistant.setState((state) => !state)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/50 text-foreground hover:bg-accent transition-all border border-border/50 shadow-sm group"
      >
        <div className="relative">
          <Robot size={18} className="group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse border border-background" />
        </div>
        <span className="text-xs font-bold tracking-tight hidden md:block">AI Assistant</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-175 h-150 bg-card rounded-2xl shadow-2xl border border-border flex flex-col backdrop-blur-2xl">
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <Robot size={20} />
              </div>
              <h3 className="font-display font-bold text-foreground tracking-tight">
                AI Assistant
              </h3>
            </div>
            <button
              onClick={() => showAIAssistant.setState((state) => !state)}
              className="text-muted-foreground hover:text-foreground hover:bg-accent p-2 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Messages messages={messages} />

          <div className="p-4 border-t border-border bg-muted/30">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim()) {
                  sendMessage(input);
                  setInput("");
                }
              }}
            >
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full rounded-xl border border-border bg-background pl-4 pr-12 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-sm"
                  rows={1}
                  style={{ minHeight: "48px", maxHeight: "120px" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = Math.min(target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && input.trim()) {
                      e.preventDefault();
                      sendMessage(input);
                      setInput("");
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 transition-all hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                  <PaperPlaneRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
