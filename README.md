# text2slack-mcp

MCP (Model Context Protocol) サーバーで、テキストメッセージを Slack に送信します。

## 概要

text2slack-mcp は、AI アシスタント（Claude など）が Slack チャンネルにメッセージを送信できるようにする MCP サーバーです。Slack の Incoming Webhook を使用してメッセージを送信します。

## 必要な環境

- Node.js 18 以降
- Slack ワークスペースの管理者権限（Incoming Webhook の設定用）

## インストール

```bash
npm install -g text2slack-mcp
```

## セットアップ

### 1. Slack Incoming Webhook の設定

1. Slack ワークスペースの管理画面から「アプリ」を開く
2. 「Incoming Webhooks」を検索して追加
3. メッセージを送信したいチャンネルを選択
4. Webhook URL をコピー（`https://hooks.slack.com/services/...` の形式）

### 2. MCP クライアントの設定

Claude Desktop または他の MCP 対応クライアントの設定ファイルに以下を追加：

```json
{
  "mcpServers": {
    "text2slack": {
      "command": "npx",
      "args": [
        "-y",
        "text2slack-mcp"
      ],
      "env": {
        "SLACK_WEBHOOK_URL": "YOUR_SLACK_WEBHOOK_URL_HERE"
      }
    }
  }
}
```

`YOUR_SLACK_WEBHOOK_URL_HERE` を実際の Webhook URL に置き換えてください。

## 使い方

MCP クライアント（Claude など）から、`send_to_slack` ツールを使ってメッセージを送信できます：

- ツール名: `send_to_slack`
- パラメータ:
  - `message` (string, 必須): Slack に送信するメッセージ

### 使用例

Claude で以下のように使用できます：

```
「今日のミーティングの議事録をSlackに送信して」と依頼すると、
Claude が send_to_slack ツールを使って自動的にメッセージを送信します。
```

## ローカル開発

```bash
# リポジトリをクローン
git clone <repository-url>
cd text2slack-mcp

# 依存関係をインストール
npm install

# 環境変数を設定
echo "SLACK_WEBHOOK_URL=your_webhook_url_here" > .env

# サーバーを起動
npm start
```

## トラブルシューティング

### エラー: SLACK_WEBHOOK_URL environment variable is not set

環境変数 `SLACK_WEBHOOK_URL` が設定されていません。MCP クライアントの設定を確認してください。

### エラー: Failed to send message to Slack

- Webhook URL が正しいか確認してください
- Slack ワークスペースでアプリが有効になっているか確認してください
- ネットワーク接続を確認してください

## ライセンス

MIT