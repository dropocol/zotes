"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";

interface TodoItemInputProps {
  placeholder?: string;
  onAdd: (title: string) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  showIcon?: boolean;
}

export function TodoItemInput({
  placeholder = "Add a task...",
  onAdd,
  disabled = false,
  className = "",
  showIcon = true,
}: TodoItemInputProps) {
  const [title, setTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title.trim() || isAdding) return;

    setIsAdding(true);
    try {
      await onAdd(title.trim());
      setTitle("");
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={className}
    >
      <div className="flex items-center gap-2">
        {showIcon && (
          <div className="flex items-center justify-center h-5 w-5">
            <Plus className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <Input
          placeholder={placeholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={disabled || isAdding}
          className="border-0 shadow-none focus-visible:ring-0 px-0 h-auto py-1 text-sm"
        />
        {title.trim() && (
          <Button
            type="submit"
            size="sm"
            disabled={isAdding}
            className="h-7"
          >
            {isAdding ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Add"
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
