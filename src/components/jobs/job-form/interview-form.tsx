"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { INTERVIEW_TYPES, getInterviewTypeDisplayName } from "@/types/jobs";
import type { InterviewType, JobInterview } from "@prisma/client";

interface InterviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobApplicationId: string;
  interview?: JobInterview | null;
  onSuccess?: () => void;
}

export function InterviewForm({
  open,
  onOpenChange,
  jobApplicationId,
  interview,
  onSuccess,
}: InterviewFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    interviewType: interview?.interviewType || ("VIDEO" as InterviewType),
    roundNumber: interview?.roundNumber?.toString() || "1",
    scheduledAt: interview?.scheduledAt
      ? new Date(interview.scheduledAt).toISOString().slice(0, 16)
      : "",
    completedAt: interview?.completedAt
      ? new Date(interview.completedAt).toISOString().slice(0, 16)
      : "",
    location: interview?.location || "",
    interviewerNames: interview?.interviewerNames || "",
    notes: interview?.notes || "",
  });

  // Reset form when interview changes
  React.useEffect(() => {
    if (open) {
      setFormData({
        interviewType: interview?.interviewType || ("VIDEO" as InterviewType),
        roundNumber: interview?.roundNumber?.toString() || "1",
        scheduledAt: interview?.scheduledAt
          ? new Date(interview.scheduledAt).toISOString().slice(0, 16)
          : "",
        completedAt: interview?.completedAt
          ? new Date(interview.completedAt).toISOString().slice(0, 16)
          : "",
        location: interview?.location || "",
        interviewerNames: interview?.interviewerNames || "",
        notes: interview?.notes || "",
      });
    }
  }, [open, interview]);

  const isEditing = !!interview;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = "/api/jobs/interviews";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: interview?.id,
          jobApplicationId,
          interviewType: formData.interviewType,
          roundNumber: parseInt(formData.roundNumber),
          scheduledAt: formData.scheduledAt || null,
          completedAt: formData.completedAt || null,
          location: formData.location || null,
          interviewerNames: formData.interviewerNames || null,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error saving interview:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Interview" : "Add Interview"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Interview Type</Label>
                <Select
                  value={formData.interviewType}
                  onValueChange={(value) => updateField("interviewType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getInterviewTypeDisplayName(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="roundNumber">Round Number</Label>
                <Input
                  id="roundNumber"
                  type="number"
                  min="1"
                  value={formData.roundNumber}
                  onChange={(e) => updateField("roundNumber", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Scheduled At</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => updateField("scheduledAt", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="completedAt">Completed At</Label>
              <Input
                id="completedAt"
                type="datetime-local"
                value={formData.completedAt}
                onChange={(e) => updateField("completedAt", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location / Meeting Link</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="Zoom link, office address, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interviewerNames">Interviewer Names</Label>
              <Input
                id="interviewerNames"
                value={formData.interviewerNames}
                onChange={(e) => updateField("interviewerNames", e.target.value)}
                placeholder="John Doe, Jane Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Interview notes, preparation tips, etc."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Interview"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
