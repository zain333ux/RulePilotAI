/**
 * Webhook Automation Module
 * Owned by Member 4 (Workflow / Agent UX / Automation).
 * 
 * Triggers external Make / Zapier webhooks.
 * IMPORTANT: RulePilot AI must function fully even if the webhook fails or is unconfigured.
 */
export async function triggerAutomationWebhook(payload: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      success: false,
      message: "MAKE_WEBHOOK_URL not configured. Core flow continues gracefully."
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return {
      success: res.ok,
      message: res.ok ? "Webhook triggered successfully." : `Webhook responded with status ${res.status}`
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Webhook network error"
    };
  }
}
