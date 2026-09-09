import type { ComponentType, ReactNode } from "react";
import Link from "next/link";

/**
 * Shared empty state for list pages: muted icon circle, title, one-line
 * description, and an optional call-to-action button.
 * Copied from zounty's design system. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  href,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
        <Icon className="size-7 text-muted-foreground" />
      </div>
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 mb-5 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action && href && (
        <Link
          href={href}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 items-center justify-center rounded-md px-4 text-sm font-medium"
        >
          {action}
        </Link>
      )}
    </div>
  );
}
