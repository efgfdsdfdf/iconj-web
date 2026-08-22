"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function AdminNotes({ orderId, notes }: { orderId: string, notes: any[] }) {
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const addNote = async () => {
    if (!newNote.trim()) return;
    setLoading(true);
    
    // Call server action or API route to securely add note.
    // For now, we hit a generic API route or we could just use a server action. 
    // Wait, let's use the DB directly if RLS allows or fetch API.
    // We will do a fetch to a secure route:
    const res = await fetch(`/api/admin/notes`, {
      method: "POST",
      body: JSON.stringify({ orderId, note: newNote }),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      toast.success("Note added");
      setNewNote("");
      router.refresh();
    } else {
      toast.error("Failed to add note");
    }
    setLoading(false);
  };

  return (
    <Card className="shadow-sm border-none bg-amber-50/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
          <FileText className="w-5 h-5 text-amber-600" />
          Internal Admin Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-4">
          {notes && notes.length > 0 ? (
            notes.map((note) => (
              <div key={note.id} className="bg-white p-3 rounded-md border border-amber-100 shadow-sm">
                <p className="text-sm text-slate-800">{note.note}</p>
                <p className="text-[10px] text-slate-400 mt-2 text-right">
                  {new Date(note.created_at).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-amber-600/70 italic">No internal notes yet.</p>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <Textarea 
            placeholder="Type a private note..." 
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="text-sm border-amber-200 focus-visible:ring-amber-500"
          />
          <Button onClick={addNote} disabled={loading || !newNote.trim()} size="sm" className="w-fit self-end bg-amber-600 hover:bg-amber-700">
            {loading ? "Saving..." : <><Plus className="w-4 h-4 mr-1"/> Add Note</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
