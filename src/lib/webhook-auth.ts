import { createHash, timingSafeEqual } from "node:crypto";
import type { User } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Shared-secret authentication for machine-to-machine webhooks.
 *
 * A webhook request has no browser session, so it authenticates with a long
 * random secret instead. The secret is read from either:
 *
 *   Authorization: Bearer <WEBHOOK_SECRET>
 *   X-Webhook-Secret: <WEBHOOK_SECRET>
 *
 * The account that receives the data is never taken from the request body.
 * It is pinned on the server with WEBHOOK_USER_EMAIL (or WEBHOOK_USER_ID), so
 * a leaked secret cannot be pointed at another account.
 *
 * See docs/webhooks.md for setup and usage.
 */

export type WebhookAuthResult =
  | { ok: true; user: User }
  | { ok: false; status: number; error: string };

/**
 * Deliberately vague: callers should not learn whether a secret or an owner
 * account is missing, or which one is wrong.
 */
const NOT_CONFIGURED = "Webhook is not configured on this server";

/**
 * Constant-time string comparison. Both inputs are hashed first so the
 * comparison never leaks length either.
 */
export function safeEqual(a: string, b: string): boolean {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

/** Pull the shared secret from the Authorization or X-Webhook-Secret header. */
export function extractWebhookSecret(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization) {
    const match = /^bearer\s+(.+)$/i.exec(authorization.trim());
    if (match) {
      const token = match[1].trim();
      if (token) return token;
    }
  }

  const headerSecret = request.headers.get("x-webhook-secret");
  if (headerSecret && headerSecret.trim()) return headerSecret.trim();

  return null;
}

/**
 * Verify the shared secret and resolve the account the payload belongs to.
 * Fails closed when the secret or the owner account is not configured.
 */
export async function authenticateWebhook(
  request: Request
): Promise<WebhookAuthResult> {
  const expectedSecret = process.env.WEBHOOK_SECRET;
  if (!expectedSecret) {
    return { ok: false, status: 503, error: NOT_CONFIGURED };
  }

  const providedSecret = extractWebhookSecret(request);
  if (!providedSecret || !safeEqual(providedSecret, expectedSecret)) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const userId = process.env.WEBHOOK_USER_ID?.trim();
  const email = process.env.WEBHOOK_USER_EMAIL?.trim();
  if (!userId && !email) {
    return { ok: false, status: 503, error: NOT_CONFIGURED };
  }

  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findUnique({ where: { email: email as string } });

  if (!user) {
    return { ok: false, status: 503, error: NOT_CONFIGURED };
  }

  return { ok: true, user };
}
