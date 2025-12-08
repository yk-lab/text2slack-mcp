# text2slack-mcp

[![npm version](https://badge.fury.io/js/text2slack-mcp.svg)](https://www.npmjs.com/package/text2slack-mcp)
[![CI](https://github.com/yk-lab/text2slack-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/yk-lab/text2slack-mcp/actions/workflows/ci.yml)
[![Maintainability](https://qlty.sh/badges/29fc7f29-79ba-420f-965b-6db0693cc186/maintainability.svg)](https://qlty.sh/gh/yk-lab/projects/text2slack-mcp)
[![Code Coverage](https://qlty.sh/badges/29fc7f29-79ba-420f-965b-6db0693cc186/test_coverage.svg)](https://qlty.sh/gh/yk-lab/projects/text2slack-mcp)
[![codecov](https://codecov.io/gh/yk-lab/text2slack-mcp/graph/badge.svg?token=9zuSClrRCg)](https://codecov.io/gh/yk-lab/text2slack-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-v1.0.0-blue.svg)](https://modelcontextprotocol.io)
[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)
[![pkg-pr-new](https://github.com/stackblitz-labs/pkg.pr.new/raw/main/packages/frontend/public/badge.svg)](https://pkg.pr.new/yk-lab/text2slack-mcp)

日本語 | [English](README.en.md)

MCP (Model Context Protocol) サーバーで、テキストメッセージを Slack に送信します。

## 概要

text2slack-mcp は、AI アシスタント（Claude など）が Slack チャンネルにメッセージを送信できるようにする MCP サーバーです。Slack の Incoming Webhook を使用してメッセージを送信します。

## 特徴

- 🚀 シンプルで軽量な MCP サーバー実装
- 🔒 npm OIDC による安全なトークンレス公開
- ✅ 100% のテストカバレッジ
- 📊 継続的な品質監視（Qlty、Codecov）
- 🛡️ セキュリティスキャン（CodeQL、Dependabot）

## 必要な環境

- Node.js 20 以降
- Slack ワークスペースの管理者権限（Incoming Webhook の設定用）
- MCP 対応クライアント（Claude Desktop、Claude Code など）

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
      "args": ["-y", "text2slack-mcp@latest"],
      "env": {
        "SLACK_WEBHOOK_URL": "YOUR_SLACK_WEBHOOK_URL_HERE"
      }
    }
  }
}
```

Claude Code:

```shell
claude mcp add text2slack  -e SLACK_WEBHOOK_URL="YOUR_SLACK_WEBHOOK_URL_HERE" npx -- -y text2slack-mcp@latest
```

`YOUR_SLACK_WEBHOOK_URL_HERE` を実際の Webhook URL に置き換えてください。

## 使い方

MCP クライアント（Claude など）から、`send_to_slack` ツールを使ってメッセージを送信できます：

- ツール名: `send_to_slack`
- パラメータ:
  - `message` (string, 必須): Slack に送信するメッセージ

### 使用例

Claude で以下のように使用できます：

```plain
「今日のミーティングの議事録をSlackに送信して」と依頼すると、
Claude が send_to_slack ツールを使って自動的にメッセージを送信します。
```

## ローカル開発

```bash
# リポジトリをクローン
git clone https://github.com/yk-lab/text2slack-mcp.git
cd text2slack-mcp

# pnpm を使用（推奨）
pnpm install

# 環境変数を設定
cp .env.example .env
# .env ファイルを編集して SLACK_WEBHOOK_URL を設定

# サーバーを起動
pnpm start
```

### テストの実行

```bash
# 単体テストと統合テスト
pnpm test

# カバレッジレポート付き
pnpm test:coverage

# ウォッチモード
pnpm test:watch
```

### コード品質

```bash
# Lint チェック
pnpm lint

# Lint 自動修正
pnpm lint:fix
```

## トラブルシューティング

### エラー: SLACK_WEBHOOK_URL environment variable is not set

環境変数 `SLACK_WEBHOOK_URL` が設定されていません。MCP クライアントの設定を確認してください。

### エラー: Failed to send message to Slack

- Webhook URL が正しいか確認してください
- Slack ワークスペースでアプリが有効になっているか確認してください
- ネットワーク接続を確認してください

## プロジェクト構造

```plain
text2slack-mcp/
├── src/
│   ├── services/      # ビジネスロジック
│   │   └── slack-client.js
│   ├── tools/         # MCP ツール定義
│   │   └── send-to-slack.js
│   └── server/        # MCP サーバー実装
│       └── mcp-server.js
├── test/
│   ├── services/      # 単体テスト
│   ├── tools/         # 単体テスト
│   └── integration/   # 統合テスト
└── cli.js            # エントリーポイント
```

## 貢献

プルリクエストを歓迎します！詳細は [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。

## セキュリティ

セキュリティの問題を発見した場合は、[SECURITY.md](.github/SECURITY.md) の手順に従って報告してください。

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) をご覧ください。
