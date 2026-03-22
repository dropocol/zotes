"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  JOB_SOURCES,
  APPLICATION_METHODS,
  JOB_APPLICATION_STATUSES,
  RESPONSE_STATUSES,
  getJobSourceDisplayName,
  getApplicationMethodDisplayName,
  getStatusDisplayName,
} from "@/types/jobs";
import {
  JobApplicationStatus,
  ResponseStatus,
} from "@prisma/client";
import type {
  JobApplication,
  JobSource,
  ApplicationMethod,
} from "@prisma/client";

interface JobFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: JobApplication | null;
  onSuccess?: (job: JobApplication) => void;
}

export function JobForm({ open, onOpenChange, job, onSuccess }: JobFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    jobTitle: job?.jobTitle || "",
    companyName: job?.companyName || "",
    source: job?.source || ("LINKEDIN" as JobSource),
    applicationMethod: job?.applicationMethod || ("WEB_PORTAL" as ApplicationMethod),
    jobPostingUrl: job?.jobPostingUrl || "",
    salaryMin: job?.salaryMin?.toString() || "",
    salaryMax: job?.salaryMax?.toString() || "",
    salaryCurrency: job?.salaryCurrency || "USD",
    location: job?.location || "",
    isRemote: job?.isRemote ?? false,
    status: job?.status || ("SAVED" as JobApplicationStatus),
    responseReceived: job?.responseReceived || ("PENDING" as ResponseStatus),
    notes: job?.notes || "",
    dateFound: job?.dateFound ? new Date(job.dateFound).toISOString().split("T")[0] : "",
    dateApplied: job?.dateApplied ? new Date(job.dateApplied).toISOString().split("T")[0] : "",
  });

  // Reset form when job changes
  React.useEffect(() => {
    if (open) {
      setFormData({
        jobTitle: job?.jobTitle || "",
        companyName: job?.companyName || "",
        source: job?.source || ("LINKEDIN" as JobSource),
        applicationMethod: job?.applicationMethod || ("WEB_PORTAL" as ApplicationMethod),
        jobPostingUrl: job?.jobPostingUrl || "",
        salaryMin: job?.salaryMin?.toString() || "",
        salaryMax: job?.salaryMax?.toString() || "",
        salaryCurrency: job?.salaryCurrency || "USD",
        location: job?.location || "",
        isRemote: job?.isRemote ?? false,
        status: job?.status || ("SAVED" as JobApplicationStatus),
        responseReceived: job?.responseReceived || ("PENDING" as ResponseStatus),
        notes: job?.notes || "",
        dateFound: job?.dateFound ? new Date(job.dateFound).toISOString().split("T")[0] : "",
        dateApplied: job?.dateApplied ? new Date(job.dateApplied).toISOString().split("T")[0] : "",
      });
    }
  }, [open, job]);

  const isEditing = !!job;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = isEditing ? `/api/jobs/${job.id}` : "/api/jobs";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
          salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null,
          dateFound: formData.dateFound || null,
          dateApplied: formData.dateApplied || null,
        }),
      });

      if (response.ok) {
        const savedJob = await response.json();
        onOpenChange(false);
        onSuccess?.(savedJob);
      }
    } catch (error) {
      console.error("Error saving job application:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      // Auto-set response received when status changes
      if (field === "status") {
        const respondedStatuses: JobApplicationStatus[] = [
          JobApplicationStatus.PHONE_SCREEN,
          JobApplicationStatus.INTERVIEW,
          JobApplicationStatus.OFFER,
          JobApplicationStatus.REJECTED,
        ];
        if (respondedStatuses.includes(value as JobApplicationStatus)) {
          next.responseReceived = ResponseStatus.YES;
        } else if (value === JobApplicationStatus.NO_RESPONSE) {
          next.responseReceived = ResponseStatus.NO;
        } else {
          next.responseReceived = ResponseStatus.PENDING;
        }
      }

      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Job Application" : "Add Job Application"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => updateField("jobTitle", e.target.value)}
                  placeholder="Senior Software Engineer"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  placeholder="Acme Inc."
                  required
                />
              </div>
            </div>

            {/* Source and Method */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source *</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => updateField("source", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {getJobSourceDisplayName(source)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Application Method *</Label>
                <Select
                  value={formData.applicationMethod}
                  onValueChange={(value) => updateField("applicationMethod", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLICATION_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {getApplicationMethodDisplayName(method)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* URL and Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobPostingUrl">Job Posting URL</Label>
                <Input
                  id="jobPostingUrl"
                  type="url"
                  value={formData.jobPostingUrl}
                  onChange={(e) => updateField("jobPostingUrl", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder="San Francisco, CA"
                />
              </div>
            </div>

            {/* Remote checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRemote"
                checked={formData.isRemote}
                onCheckedChange={(checked) => updateField("isRemote", checked as boolean)}
              />
              <Label htmlFor="isRemote" className="font-normal">
                Remote position
              </Label>
            </div>

            {/* Salary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salaryMin">Min Salary</Label>
                <Input
                  id="salaryMin"
                  type="number"
                  value={formData.salaryMin}
                  onChange={(e) => updateField("salaryMin", e.target.value)}
                  placeholder="100000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMax">Max Salary</Label>
                <Input
                  id="salaryMax"
                  type="number"
                  value={formData.salaryMax}
                  onChange={(e) => updateField("salaryMax", e.target.value)}
                  placeholder="150000"
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={formData.salaryCurrency}
                  onValueChange={(value) => updateField("salaryCurrency", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status and Response */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateField("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_APPLICATION_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusDisplayName(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Response Received</Label>
                <Select
                  value={formData.responseReceived}
                  onValueChange={(value) => updateField("responseReceived", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESPONSE_STATUSES.map((response) => (
                      <SelectItem key={response} value={response}>
                        {response === "YES" ? "Yes" : response === "NO" ? "No" : "Pending"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFound">Date Found</Label>
                <Input
                  id="dateFound"
                  type="date"
                  value={formData.dateFound}
                  onChange={(e) => updateField("dateFound", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateApplied">Date Applied</Label>
                <Input
                  id="dateApplied"
                  type="date"
                  value={formData.dateApplied}
                  onChange={(e) => updateField("dateApplied", e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Add any notes about this application..."
                rows={4}
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
              {isEditing ? "Save Changes" : "Add Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
