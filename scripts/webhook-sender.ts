#!/usr/bin/env node

/**
 * Standalone webhook sender script for background job processing
 *
 * This script runs independently of the Next.js app and sends periodic webhooks
 * to trigger job processing. This solves the issue of running background jobs
 * in a Next.js environment where long-running processes are not ideal.
 *
 * Usage:
 *   node dist/scripts/webhook-sender.js
 *   NODE_ENV=production node dist/scripts/webhook-sender.js
 *
 * Environment variables (override CONFIG below):
 *   WEBHOOK_URL - The webhook endpoint URL
 *   WEBHOOK_SECRET - The webhook secret for authentication
 *   INTERVAL_SECONDS - Polling interval in seconds
 *   MAX_JOBS - Maximum jobs to process per request
 */

// ============================================================================
// CONFIGURATION - Edit these values directly or use environment variables
// ============================================================================

const CONFIG = {
  // Webhook endpoint configuration
  webhookUrl:
    process.env.WEBHOOK_URL || "http://localhost:3500/api/admin/jobs/webhook",
  webhookSecret: process.env.WEBHOOK_SECRET || "dev-webhook-secret",

  // Job processing behavior
  interval: parseInt(process.env.INTERVAL_SECONDS || "10", 10), // seconds between webhook calls
  maxJobs: parseInt(process.env.MAX_JOBS || "3", 10), // max jobs to process per request

  // Display settings
  showTimestamps: true, // show timestamp in logs
  showStats: true, // show stats summary on shutdown
  coloredOutput: true, // enable colored console output
} as const;

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface WebhookResponse {
  success: boolean;
  message: string;
  processed?: number;
  succeeded?: number;
  failed?: number;
  results?: {
    processed: number;
    succeeded: number;
    failed: number;
    errors: Array<{ jobId: string; error: string }>;
  };
  error?: string;
}

interface Stats {
  totalRequests: number;
  totalProcessed: number;
  totalSucceeded: number;
  totalFailed: number;
  startTime: Date;
}

// ============================================================================
// WEBHOOK SENDER CLASS
// ============================================================================

class WebhookSender {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private stats: Stats = {
    totalRequests: 0,
    totalProcessed: 0,
    totalSucceeded: 0,
    totalFailed: 0,
    startTime: new Date(),
  };

  /**
   * Send a single webhook request to trigger job processing
   */
  private async sendWebhook(): Promise<WebhookResponse> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(CONFIG.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CONFIG.webhookSecret}`,
          "User-Agent": "HTK-Webhook-Sender/1.0",
        },
        body: JSON.stringify({
          action: "process-jobs",
          maxJobs: CONFIG.maxJobs,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: WebhookResponse = await response.json();
      const duration = Date.now() - startTime;

      // Update stats
      this.stats.totalRequests++;
      if (data.success) {
        this.stats.totalProcessed += data.processed || 0;
        this.stats.totalSucceeded += data.succeeded || 0;
        this.stats.totalFailed += data.failed || 0;
      }

      this.logResponse(data, duration);
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logError(error, duration);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Log webhook response
   */
  private logResponse(data: WebhookResponse, duration: number): void {
    if (CONFIG.showTimestamps) {
      const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
      const statusColor = data.success ? this.colors.green : this.colors.red;

      console.log(
        `${this.colors.dim}[${timestamp}]${this.colors.reset} ${statusColor}${data.success ? "✓" : "✗"}${this.colors.reset} ${duration}ms`,
      );

      if (data.success) {
        if (data.processed === 0) {
          console.log(
            `  ${this.colors.dim}No pending jobs${this.colors.reset}`,
          );
        } else {
          console.log(
            `  ${this.colors.cyan}Processed:${this.colors.reset} ${data.processed} jobs`,
          );
          if ((data.succeeded ?? 0) > 0) {
            console.log(
              `  ${this.colors.green}✓ Succeeded:${this.colors.reset} ${data.succeeded}`,
            );
          }
          if ((data.failed ?? 0) > 0) {
            console.log(
              `  ${this.colors.red}✗ Failed:${this.colors.reset} ${data.failed}`,
            );
            if (data.results?.errors?.length) {
              for (const err of data.results.errors.slice(0, 3)) {
                console.log(
                  `    ${this.colors.red}•${this.colors.reset} ${err.error}`,
                );
              }
              if (data.results.errors.length > 3) {
                console.log(
                  `    ${this.colors.dim}... and ${data.results.errors.length - 3} more${this.colors.reset}`,
                );
              }
            }
          }
        }
      } else {
        console.log(
          `  ${this.colors.red}Error:${this.colors.reset} ${data.message || data.error}`,
        );
      }
    } else {
      // Simplified output without timestamps
      const statusColor = data.success ? this.colors.green : this.colors.red;
      console.log(
        `${statusColor}${data.success ? "✓" : "✗"}${this.colors.reset} ${duration}ms`,
      );

      if (data.success) {
        if (data.processed === 0) {
          console.log(
            `  ${this.colors.dim}No pending jobs${this.colors.reset}`,
          );
        } else {
          console.log(
            `  ${this.colors.cyan}Processed:${this.colors.reset} ${data.processed} jobs`,
          );
          if ((data.succeeded ?? 0) > 0) {
            console.log(
              `  ${this.colors.green}✓ Succeeded:${this.colors.reset} ${data.succeeded}`,
            );
          }
          if ((data.failed ?? 0) > 0) {
            console.log(
              `  ${this.colors.red}✗ Failed:${this.colors.reset} ${data.failed}`,
            );
            if (data.results?.errors?.length) {
              for (const err of data.results.errors.slice(0, 3)) {
                console.log(
                  `    ${this.colors.red}•${this.colors.reset} ${err.error}`,
                );
              }
              if (data.results.errors.length > 3) {
                console.log(
                  `    ${this.colors.dim}... and ${data.results.errors.length - 3} more${this.colors.reset}`,
                );
              }
            }
          }
        }
      } else {
        console.log(
          `  ${this.colors.red}Error:${this.colors.reset} ${data.message || data.error}`,
        );
      }
    }
  }

  /**
   * Log error with details
   */
  private logError(error: unknown, duration: number): void {
    if (CONFIG.showTimestamps) {
      const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
      console.log(
        `${this.colors.dim}[${timestamp}]${this.colors.reset} ${this.colors.red}✗${this.colors.reset} ${duration}ms`,
      );
      console.log(
        `  ${this.colors.red}Error:${this.colors.reset} ${error instanceof Error ? error.message : String(error)}`,
      );
    } else {
      console.log(`${this.colors.red}✗${this.colors.reset} ${duration}ms`);
      console.log(
        `  ${this.colors.red}Error:${this.colors.reset} ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * ANSI color codes for terminal output
   */
  private get colors() {
    return CONFIG.coloredOutput
      ? {
          reset: "\x1b[0m",
          dim: "\x1b[2m",
          red: "\x1b[31m",
          green: "\x1b[32m",
          yellow: "\x1b[33m",
          blue: "\x1b[34m",
          magenta: "\x1b[35m",
          cyan: "\x1b[36m",
          white: "\x1b[37m",
        }
      : {
          reset: "",
          dim: "",
          red: "",
          green: "",
          yellow: "",
          blue: "",
          magenta: "",
          cyan: "",
          white: "",
        };
  }

  /**
   * Print statistics summary
   */
  private printStats(): void {
    if (!CONFIG.showStats) return;

    const uptime = Date.now() - this.stats.startTime.getTime();
    const uptimeMinutes = Math.floor(uptime / 60000);
    const uptimeSeconds = Math.floor((uptime % 60000) / 1000);

    console.log("\n" + "=".repeat(50));
    console.log(
      `         ${this.colors.cyan}Webhook Sender Statistics${this.colors.reset}         `,
    );
    console.log("".padEnd(50));
    console.log(`  Uptime:        ${uptimeMinutes}m ${uptimeSeconds}s`);
    console.log(`  Total Requests: ${this.stats.totalRequests}`);
    console.log(`  Total Processed: ${this.stats.totalProcessed}`);
    console.log(`  Total Succeeded: ${this.stats.totalSucceeded}`);
    console.log(`  Total Failed:    ${this.stats.totalFailed}`);
    console.log("=".repeat(50));
  }

  /**
   * Start the webhook sender
   */
  start(): void {
    if (this.isRunning) {
      console.log(
        `${this.colors.yellow}Webhook sender is already running${this.colors.reset}`,
      );
      return;
    }

    this.isRunning = true;
    console.log("\n" + "=".repeat(50));
    console.log(
      `         ${this.colors.cyan}HTK Webhook Sender${this.colors.reset}             `,
    );
    console.log("".padEnd(50));
    console.log(
      `  Webhook URL:  ${this.colors.white}${CONFIG.webhookUrl}${this.colors.reset}`,
    );
    console.log(
      `  Interval:      ${this.colors.white}${CONFIG.interval}s${this.colors.reset}`,
    );
    console.log(
      `  Max Jobs:      ${this.colors.white}${CONFIG.maxJobs}${this.colors.reset}`,
    );
    console.log(
      `  Environment:   ${this.colors.white}${process.env.NODE_ENV || "development"}${this.colors.reset}`,
    );
    console.log("=".repeat(50));
    console.log(
      `\n${this.colors.green}Starting webhook sender...${this.colors.reset} (Press Ctrl+C to stop)\n`,
    );

    // Initial webhook
    this.sendWebhook();

    // Set up interval
    this.intervalId = setInterval(() => {
      this.sendWebhook();
    }, CONFIG.interval * 1000);

    // Handle graceful shutdown
    process.on("SIGINT", () => this.shutdown("SIGINT"));
    process.on("SIGTERM", () => this.shutdown("SIGTERM"));
  }

  /**
   * Stop the webhook sender
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * Shutdown gracefully
   */
  private shutdown(signal: string): void {
    console.log(
      `\n${this.colors.yellow}Received ${signal}, shutting down gracefully...${this.colors.reset}`,
    );
    this.stop();
    this.printStats();
    console.log(
      `\n${this.colors.green}Webhook sender stopped.${this.colors.reset}\n`,
    );
    process.exit(0);
  }
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

function main() {
  const sender = new WebhookSender();
  sender.start();
}

// Run if called directly
main();
