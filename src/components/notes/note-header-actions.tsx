"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectSelect } from "@/components/common/project-select";
import { Loader2, Save, Trash2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface NoteHeaderActionsProps {
  autoSaveStatus: "idle" | "saving" | "saved";
  hasChanges?: boolean;
  isSaving?: boolean;
  isDeleting?: boolean;
  selectedProject: string | null;
  onProjectChange: (value: string | null) => void;
  onSave?: () => void;
  onDelete?: () => void;
  showPinned?: boolean;
  disabled?: boolean;
}

export function NoteHeaderActions({
  autoSaveStatus,
  hasChanges = false,
  isSaving = false,
  isDeleting = false,
  selectedProject,
  onProjectChange,
  onSave,
  onDelete,
  showPinned = false,
  disabled = false,
}: NoteHeaderActionsProps) {
  return (
    <>
      {autoSaveStatus === "saving" && (
        <Badge variant="outline" className="text-muted-foreground">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Saving...
        </Badge>
      )}
      {autoSaveStatus === "saved" && (
        <Badge variant="outline" className="text-green-600 border-green-200">
          <Check className="mr-1 h-3 w-3" />
          Saved
        </Badge>
      )}
      {hasChanges && autoSaveStatus === "idle" && (
        <Badge variant="outline" className="text-muted-foreground">
          Unsaved changes
        </Badge>
      )}
      <ProjectSelect
        value={selectedProject}
        onChange={onProjectChange}
        triggerClassName="w-[180px] h-8 text-sm"
      />
      {showPinned && <Badge variant="secondary">Pinned</Badge>}
      {onDelete && (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="text-destructive bg-red-50 h-8 w-8"
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Note</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this note? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {}}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {onSave && (
        <Button
          onClick={onSave}
          disabled={disabled || isSaving}
          size="sm"
          className="h-8"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save
        </Button>
      )}
    </>
  );
}
