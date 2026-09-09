"use client";

import * as React from "react";
import { Check, Copy, Link2Off, RefreshCw, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ShareStatsButtonProps {
  shareToken: string | null;
}

/**
 * Lets the user create, copy, rotate, or disable a public link to
 * /share/[token] — a read-only, non-indexable view of their job stats.
 */
export function ShareStatsButton({ shareToken }: ShareStatsButtonProps) {
  const router = useRouter();
  const [token, setToken] = React.useState(shareToken);
  const [open, setOpen] = React.useState(false);
  const [isBusy, setIsBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const shareUrl = token
    ? `${typeof window === "undefined" ? "" : window.location.origin}/share/${token}`
    : null;

  async function call(method: "POST" | "DELETE") {
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/stats/share", { method });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setToken(data.shareToken ?? null);
      setCopied(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsBusy(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy — select the link and copy it manually.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="size-4" />
          <span className="hidden sm:inline">
            {token ? "Shared" : "Share"}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share your job hunt stats</DialogTitle>
          <DialogDescription>
            Creates a private link to a read-only stats page. It&apos;s hidden
            from search engines and impossible to guess — anyone with the link
            can view, so only share it with people you trust.
          </DialogDescription>
        </DialogHeader>

        {token && shareUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.target.select()}
                className="text-xs"
              />
              <Button
                size="icon"
                variant="outline"
                className="shrink-0"
                onClick={copyLink}
                aria-label="Copy link"
              >
                {copied ? (
                  <Check className="size-4 text-emerald-600" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
            {copied && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Link copied to clipboard
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={() => {
                  if (confirm("Generate a new link? The old link will stop working immediately.")) {
                    call("POST");
                  }
                }}
              >
                <RefreshCw className="size-3.5" />
                New link
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isBusy}
                onClick={() => {
                  if (confirm("Disable sharing? The current link will stop working immediately.")) {
                    call("DELETE");
                  }
                }}
              >
                <Link2Off className="size-3.5" />
                Disable
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Button onClick={() => call("POST")} disabled={isBusy}>
              <Share2 className="size-4" />
              {isBusy ? "Creating…" : "Create public link"}
            </Button>
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
