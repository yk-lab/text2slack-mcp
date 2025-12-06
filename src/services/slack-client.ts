export interface SendMessageResult {
  success: boolean;
  message: string;
}

export interface SlackClientOptions {
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

export class SlackClient {
  private readonly webhookUrl: string;
  private readonly timeoutMs: number;

  constructor(webhookUrl: string, options: SlackClientOptions = {}) {
    if (!webhookUrl) {
      throw new Error('Slack webhook URL is required');
    }
    this.webhookUrl = webhookUrl;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async sendMessage(message: string): Promise<SendMessageResult> {
    if (!message || typeof message !== 'string') {
      throw new Error('Message must be a non-empty string');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to send message to Slack. Status: ${response.status}`,
        );
      }

      return {
        success: true,
        message: message,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request to Slack timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
