export class SlackClient {
  constructor(webhookUrl) {
    if (!webhookUrl) {
      throw new Error('Slack webhook URL is required');
    }
    this.webhookUrl = webhookUrl;
  }

  async sendMessage(message) {
    if (!message || typeof message !== 'string') {
      throw new Error('Message must be a non-empty string');
    }

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
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
  }
}
