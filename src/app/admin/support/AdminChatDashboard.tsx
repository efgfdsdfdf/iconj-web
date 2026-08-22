"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, MessageSquare } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { replyToUser } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

export function AdminChatDashboard({ initialMessages }: { initialMessages: any[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Group messages by user_id
  const users = Array.from(new Set(messages.map(m => m.user_id)));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUserId]);

  useEffect(() => {
    const channel = supabase
      .channel("admin_support")
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_messages' 
      }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId) return;

    setLoading(true);
    const text = newMessage;
    setNewMessage("");

    // Optimistic UI
    const tempMsg = {
      id: crypto.randomUUID(),
      user_id: selectedUserId,
      message: text,
      is_from_admin: true,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    const res = await replyToUser(selectedUserId, text);
    if (res.error) {
      toast.error(res.error);
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    }
    setLoading(false);
  };

  const activeMessages = messages.filter(m => m.user_id === selectedUserId);

  return (
    <Card className="flex h-full overflow-hidden border-none shadow-sm">
      {/* Left sidebar: User List */}
      <div className="w-1/3 min-w-[250px] border-r bg-white flex flex-col h-full overflow-y-auto">
        <div className="p-4 border-b bg-slate-50/50">
          <h2 className="font-bold text-slate-800">Active Conversations</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {users.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm mt-10">No messages yet.</div>
          ) : (
            users.map(uid => {
              const userMessages = messages.filter(m => m.user_id === uid);
              const lastMsg = userMessages[userMessages.length - 1];
              return (
                <button 
                  key={uid}
                  onClick={() => setSelectedUserId(uid)}
                  className={`w-full text-left p-4 border-b hover:bg-slate-50 transition-colors flex gap-3 \${selectedUserId === uid ? "bg-blue-50/50 border-l-4 border-l-blue-500" : "border-l-4 border-l-transparent"}`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">Customer</h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{lastMsg.message}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right side: Chat Window */}
      <div className="flex-1 bg-slate-50 flex flex-col h-full">
        {!selectedUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-16 h-16 mb-4 text-slate-300" />
            <p>Select a conversation to start chatting.</p>
          </div>
        ) : (
          <>
            <div className="p-4 bg-white border-b shadow-sm z-10">
              <h2 className="font-bold text-slate-800">Chatting with Customer</h2>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
              {activeMessages.map((msg) => (
                <div key={msg.id} className={`flex \${!msg.is_from_admin ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl \${!msg.is_from_admin ? "bg-white border text-slate-800 rounded-tl-none" : "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20"}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <span className={`text-[10px] block mt-1 \${!msg.is_from_admin ? "text-slate-400" : "text-blue-200 text-right"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 bg-white border-t">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input 
                  placeholder="Type your reply..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={loading}
                  className="flex-1"
                />
                <Button type="submit" disabled={!newMessage.trim() || loading} className="bg-blue-600 hover:bg-blue-700">
                  <Send className="w-4 h-4 mr-2" /> Send
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
