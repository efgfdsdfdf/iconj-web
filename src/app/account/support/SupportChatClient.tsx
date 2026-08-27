"use client";

import { Input } from "@/components/ui/input";
import { Send, MessageSquare, ChevronLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { sendSupportMessage } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Link from "next/link";

export function SupportChatClient({ initialMessages, userId }: { initialMessages: any[], userId: string }) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel("support_messages")
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_messages',
        filter: `user_id=eq.${userId}`
      }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    const text = newMessage;
    setNewMessage("");

    // Optimistic UI
    const tempMsg = {
      id: crypto.randomUUID(),
      message: text,
      is_from_admin: false,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    const res = await sendSupportMessage(text);
    if (res.error) {
      toast.error(res.error);
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id)); // revert
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 bg-[#efeae2] flex flex-col relative w-full h-full max-w-4xl mx-auto border-x border-slate-200 shadow-sm">
      {/* Chat Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>

      {/* Header */}
      <div className="h-16 px-4 bg-[#00a884] text-white flex items-center gap-3 shrink-0 relative z-10 shadow-sm">
        <Link href="/account" className="p-2 -ml-2 hover:bg-black/10 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <h2 className="font-bold text-white text-base">ICONJ Support Team</h2>
          <span className="text-xs text-white/80">Typically replies in a few minutes</span>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2 relative z-10">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 h-full">
            <div className="bg-[#fff9c4] text-[#8a6d3b] p-3 rounded-lg text-xs max-w-xs text-center shadow-sm mb-4">
              Send us a message and one of our agents will reply as soon as possible.
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = !msg.is_from_admin;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const showTail = !prevMsg || prevMsg.is_from_admin !== msg.is_from_admin;
            
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} ${showTail ? 'mt-2' : ''}`}>
                <div className={`max-w-[85%] sm:max-w-[75%] px-3 py-2 rounded-lg relative shadow-sm text-sm ${
                  isMe 
                    ? "bg-[#d9fdd3] text-slate-800 rounded-tr-sm" 
                    : "bg-white text-slate-800 rounded-tl-sm"
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed pb-3 pr-4">{msg.message}</p>
                  <span className={`text-[10px] absolute bottom-1 right-2 ${isMe ? "text-emerald-700/70" : "text-slate-400"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-slate-50 relative z-10">
        <form onSubmit={handleSend} className="flex gap-2 items-center bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200">
          <Input 
            placeholder="Type a message..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
            className="flex-1 border-none shadow-none focus-visible:ring-0 px-0 h-auto"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || loading} 
            className="text-slate-500 hover:text-[#00a884] disabled:opacity-50 transition-colors p-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
