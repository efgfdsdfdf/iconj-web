"use client";

import { Card } from "@/components/ui/card";
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
      }, async (payload) => {
        // Fetch profile info for the new message to keep the join data intact
        const { data: profileData } = await supabase.from('profiles').select('full_name, email').eq('id', payload.new.user_id).single();
        const msgWithProfile = { ...payload.new, profiles: profileData };
        setMessages(prev => [...prev, msgWithProfile]);
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
      created_at: new Date().toISOString(),
      profiles: null // admin doesn't need its own profile rendered here usually
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
    <div className="flex h-full w-full overflow-hidden bg-white">
      {/* Left sidebar: User List */}
      <div className="w-1/3 min-w-[300px] max-w-[400px] border-r border-slate-200 bg-white flex flex-col h-full z-10">
        <div className="h-16 border-b border-slate-200 bg-slate-50 flex items-center px-4 shrink-0">
          <h2 className="font-bold text-slate-800 text-lg">Support Inbox</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {users.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No messages yet.</div>
          ) : (
            users.map(uid => {
              const userMessages = messages.filter(m => m.user_id === uid);
              const lastMsg = userMessages[userMessages.length - 1];
              
              // Calculate unread (if last message is from customer, we consider it unread for admin until they reply)
              // This is a naive WhatsApp style read-receipt approximation since we don't have is_read column yet.
              const lastAdminMsgIndex = userMessages.findLastIndex(m => m.is_from_admin);
              const unreadCount = userMessages.length - 1 - lastAdminMsgIndex;
              const hasUnread = unreadCount > 0;

              const customerProfile = userMessages.find(m => m.profiles)?.profiles;
              const customerName = customerProfile?.full_name || customerProfile?.email?.split('@')[0] || "Customer";
              const customerEmail = customerProfile?.email || "";

              return (
                <button 
                  key={uid}
                  onClick={() => setSelectedUserId(uid)}
                  className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors flex gap-3 ${selectedUserId === uid ? "bg-slate-100" : ""}`}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-500 font-bold text-lg">
                    {customerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={`truncate text-sm ${hasUnread && selectedUserId !== uid ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {customerName}
                      </h3>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                        {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-xs truncate pr-2 ${hasUnread && selectedUserId !== uid ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                        {lastMsg.is_from_admin ? 'You: ' : ''}{lastMsg.message}
                      </p>
                      {hasUnread && selectedUserId !== uid && (
                        <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right side: Chat Window */}
      <div className="flex-1 bg-[#efeae2] flex flex-col h-full relative">
        {/* Chat Background Pattern (WhatsApp style) */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>

        {!selectedUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 relative z-10 bg-slate-50">
            <MessageSquare className="w-16 h-16 mb-4 text-slate-300" />
            <p className="text-lg">ICONJ Support Desk</p>
            <p className="text-sm mt-2 text-slate-400">Select a conversation to view messages</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3 shrink-0 relative z-10">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-500 font-bold">
                {activeMessages.find(m => m.profiles)?.profiles?.full_name?.charAt(0).toUpperCase() || 
                 activeMessages.find(m => m.profiles)?.profiles?.email?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div className="flex flex-col">
                <h2 className="font-bold text-slate-800 text-sm">
                  {activeMessages.find(m => m.profiles)?.profiles?.full_name || 'Customer'}
                </h2>
                <span className="text-xs text-slate-500">
                  {activeMessages.find(m => m.profiles)?.profiles?.email || ''}
                </span>
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2 relative z-10">
              {activeMessages.map((msg, index) => {
                const isMe = msg.is_from_admin;
                const prevMsg = index > 0 ? activeMessages[index - 1] : null;
                const showTail = !prevMsg || prevMsg.is_from_admin !== isMe;
                
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} ${showTail ? 'mt-2' : ''}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-lg relative shadow-sm text-sm ${
                      isMe 
                        ? "bg-[#d9fdd3] text-slate-800 rounded-tr-sm" 
                        : "bg-white text-slate-800 rounded-tl-sm"
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed pb-3 pr-2">{msg.message}</p>
                      <span className={`text-[10px] absolute bottom-1 right-2 ${isMe ? "text-emerald-700/70" : "text-slate-400"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Chat Input */}
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
                  className="text-slate-500 hover:text-blue-600 disabled:opacity-50 transition-colors p-2"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
