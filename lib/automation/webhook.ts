/**
 * Optional server-side Make / Zapier webhook adapter.
 * Failure must preserve the core decision and generated action.
 */
import "server-only";

export interface AutomationWebhookOptions {
  timeoutMs?: number;
}

export interface AutomationWebhookResult {
  success: boolean;
  message: string;
  status?: number;
  error?: string;
}

export async function triggerAutomationWebhook(
  payload: Record<string, unknown>,
  options: AutomationWebhookOptions = {},
): Promise<AutomationWebhookResult> {
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      success: false,
      message: "Webhook not configured. Core flow continues.",
    };
  }

  const timeoutMs = options.timeoutMs ?? 5000;

  if (
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0 ||
    timeoutMs > 30000
  ) {
    return {
      success: false,
      message: "Invalid webhook timeout. Core flow continues.",
      error: "INVALID_TIMEOUT",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    return {
      success: response.ok,
      status: response.status,
      message: response.ok
        ? "Webhook request accepted."
        : `Webhook returned HTTP ${response.status}. Core flow continues.`,
      ...(response.ok ? {} : { error: "HTTP_ERROR" }),
    };
  } catch {
    return {
      success: false,
      message: controller.signal.aborted
        ? `Webhook timed out after ${timeoutMs}ms. Core flow continues.`
        : "Webhook request failed. Core flow continues.",
      error: controller.signal.aborted
        ? "TIMEOUT"
        : "REQUEST_FAILED",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}