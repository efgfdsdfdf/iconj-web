"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, ShieldAlert } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { sendSupportMessage } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

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
    <Card className="border-none shadow-sm h-[600px] flex flex-col">
      <CardHeader className="border-b bg-slate-50/50 py-4">
        <CardTitle className="text-lg flex items-center">
          ICONJ Support Team
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 h-full">
            <ShieldAlert className="w-12 h-12 mb-3 text-slate-300" />
            <p>How can we help you today?</p>
            <p className="text-xs mt-2">Send us a message and we'll reply as soon as possible.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.is_from_admin ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl ${msg.is_from_admin ? "bg-white border text-slate-800 rounded-tl-none" : "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20"}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                <span className={`text-[10px] block mt-1 ${msg.is_from_admin ? "text-slate-400" : "text-blue-200 text-right"}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </CardContent>

      <div className="p-4 border-t bg-white rounded-b-xl">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input 
            placeholder="Type your message..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
            className="flex-1 rounded-full px-4"
          />
          <Button type="submit" disabled={!newMessage.trim() || loading} className="rounded-full w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700">
            <Send className="w-4 h-4 ml-0.5" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
