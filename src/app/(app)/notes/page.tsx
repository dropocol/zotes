"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { NotesTable } from "@/components/notes/notes-table";
import { Loader2 } from "lucide-react";

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    try {
      const response = await fetch("/api/notes");
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <DashboardLayout
      breadcrumbs={[{ title: "Notes", href: "/notes" }]}
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
        <p className="text-muted-foreground">
          All your notes in one place
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <NotesTable notes={notes} onRefresh={fetchNotes} />
      )}
    </DashboardLayout>
  );
}
