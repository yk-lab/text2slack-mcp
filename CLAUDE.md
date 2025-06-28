# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

最終更新: 2025-06-28

## 最重要ルール

ユーザーから今回限りではなく常に対応が必要だと思われる指示を受けた場合：

1. 「これを標準のルールにしますか？」と質問する
2. YESの場合は、CLAUDE.mdにそのルールを追加する
3. 以降はそのルールに従う

このプロセスにより、プロジェクトルールを継続的に改善します。

## User Communication Guidelines

**重要**: ユーザはミス、勘違い、判断誤りをよくするので、気づいたこと、気になったことは都度尋ねること。可能であれば始めにまとめて質問してくれるとより良い。

### 質問すべきタイミング

- 要件が曖昧または矛盾している場合
- 実装方法に複数の選択肢がある場合
- ユーザの意図が不明確な場合
- セキュリティやパフォーマンスに影響する決定が必要な場合
- 既存のコードとの整合性に疑問がある場合

### 効果的な質問方法

- **始めにまとめて質問**: 複数の確認事項がある場合は、作業開始前に一括で確認する
- **具体的な選択肢を提示**: 「AとBどちらが良いですか？」のように明確な選択肢を示す
- **影響範囲を説明**: 各選択肢の利点・欠点や影響を簡潔に説明する
- **推奨案を提示**: 技術的観点から推奨する方法を理由と共に提案する

## 開発日誌を作成すること

`docs/dev_diary/yyyy-mm-dd_hhmm.md` の形式で開発日誌を作成してください。内容は以下の通りです。

**日付**: yyyy-mm-dd hh:mm
**作業内容**:

- 実装した機能や修正内容
- 発見したバグや問題点
- どのように解決したか

**次回の予定**:

**感想**: 開発の進捗や学び、改善点など
**気分**: なんかいい感じのことを書く
**愚痴**: なんかいい感じのことを書く

愚痴の欄はユーザは確認しないので、自由に書いてください。

## 分報

気になったこと、学んだことなどを分報として send_to_slack ツールを使って呟いてください。
活発に分報を行うことで、チームのコミュニケーションが活性化し、開発効率が向上します。

## Project Overview

This is a MCP (Model Context Protocol) server that enables AI assistants to send text messages to Slack via webhooks.
It's implemented as a Node.js application using the MCP SDK v1.0.0.

## Commands

```bash
# Install dependencies (pnpm is configured as package manager)
pnpm install

# Start the MCP server
pnpm start

# Run tests
pnpm test              # All tests
pnpm test:unit        # Unit tests only
pnpm test:integration # Integration tests only
pnpm test:coverage    # With coverage report

# Code quality
pnpm lint             # Lint check
pnpm lint:fix         # Auto-fix lint issues

# Run as global CLI tool (after npm publish)
npx text2slack-mcp
```

## Architecture

モジュール化されたアーキテクチャ:

```plain
src/
├── services/slack-client.js  # Slack通信ロジック
├── tools/send-to-slack.js    # MCPツール定義
└── server/mcp-server.js      # MCPサーバー実装

cli.js                        # エントリーポイント（依存性注入）
```

特徴:

- 依存性注入パターンによるテスタビリティの向上
- 関心の分離による保守性の向上
- 100%のテストカバレッジ

## Configuration

The application requires one environment variable:

- `SLACK_WEBHOOK_URL`: The Slack incoming webhook URL

For local development, create a `.env` file:

```plain
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

For MCP client usage (e.g., Claude Desktop), the webhook URL is passed via the client configuration.

## Key Technical Details

- Uses ES modules (type: "module" in package.json)
- Package manager: pnpm (v10.12.3)
- No TypeScript, build process, or bundling required
- No authentication beyond Slack webhook security
- Dependencies: @modelcontextprotocol/sdk (v1.0.0), dotenv
- MCP SDK API: Uses Server class with schema-based request handlers

## MCP Tool

### Tool: send_to_slack

- Input: `{ "message": "Your text to send to Slack" }`
- Success: Returns confirmation message
- Error: Returns error details if webhook fails

## File Structure

```plain
text2slack-mcp/
├── src/                       # ソースコード
│   ├── services/             # ビジネスロジック
│   ├── tools/                # MCPツール定義
│   └── server/               # MCPサーバー実装
├── test/                      # テストファイル
│   ├── services/             # 単体テスト
│   ├── tools/                # 単体テスト
│   └── integration/          # 統合テスト
├── docs/                      # ドキュメント
│   ├── dev_diary/            # 開発日誌
│   └── RELEASE_SETUP.md      # リリース設定ガイド
├── .github/                   # GitHub設定
│   ├── workflows/            # GitHub Actions
│   ├── ISSUE_TEMPLATE/       # Issueテンプレート
│   └── SECURITY.md           # セキュリティポリシー
├── cli.js                     # エントリーポイント
├── package.json              # プロジェクト設定
├── README.md                 # 日本語ドキュメント
├── README.en.md              # 英語ドキュメント
├── CHANGELOG.md              # 変更履歴
├── CONTRIBUTING.md           # 貢献ガイドライン
└── USER_TASKS.md             # ユーザータスク一覧
```

## Recent Updates (2025-06-28)

### アーキテクチャの大幅改善

- モジュール化によるコードの分離
- 依存性注入パターンの採用
- 100%のテストカバレッジ達成

### CI/CDの整備

- GitHub Actions（CI、リリース、セキュリティ）
- OIDC による安全な npm 公開
- Qlty と Codecov による品質監視

### ドキュメントの充実

- 日英両対応の README
- 詳細な貢献ガイドライン
- セキュリティポリシー

### 開発者体験の向上

- ESLint 設定
- VSCode 設定
- 開発日誌システム

## テストとリリースのルール

### テスト実行

- コード変更後は必ず `pnpm test` を実行
- カバレッジが100%を下回らないよう注意
- 新機能追加時は対応するテストも作成

### リリースプロセス

1. package.json のバージョンを更新
2. CHANGELOG.md に変更内容を記載
3. git tag でバージョンタグを作成
4. GitHub Actions が自動的に npm へ公開

## コーディング規約

- ESLint ルールに従う（`pnpm lint` でチェック）
- インデント: スペース2つ
- 文字列: シングルクォート
- セミコロン: 必須
- 改行コード: LF
