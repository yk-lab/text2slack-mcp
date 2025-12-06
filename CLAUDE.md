# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

最終更新: 2025-12-06 (TypeScript 移行)

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

# Build TypeScript
pnpm build            # Compile TypeScript to dist/

# Start the MCP server
pnpm start            # Runs compiled code from dist/

# Run tests (automatically builds before testing)
pnpm test              # All tests
pnpm test:unit        # Unit tests only
pnpm test:integration # Integration tests only
pnpm test:coverage    # With coverage report

# Code quality
pnpm lint             # Lint check
pnpm lint:fix         # Auto-fix lint issues
pnpm typecheck        # TypeScript type checking only

# Run as global CLI tool (after npm publish)
npx text2slack-mcp
```

## Architecture

モジュール化されたアーキテクチャ（TypeScript）:

```plain
src/
├── services/slack-client.ts  # Slack通信ロジック
├── tools/send-to-slack.ts    # MCPツール定義
└── server/mcp-server.ts      # MCPサーバー実装

cli.ts                        # エントリーポイント（依存性注入）

dist/                         # コンパイル後のJSファイル（自動生成）
├── src/
└── cli.js
```

特徴:

- **TypeScript** による型安全な開発
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

- **TypeScript**: 型安全な開発環境
- Uses ES modules (type: "module" in package.json)
- Package manager: pnpm (v10.14.0)
- ビルドプロセス: `tsc` で TypeScript をコンパイル
- No authentication beyond Slack webhook security
- Dependencies: @modelcontextprotocol/sdk (v1.24.3), dotenv
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
│   ├── PR_CHECKLIST.md       # PRチェックリスト
│   └── RELEASE.md            # リリースガイド
├── .github/                   # GitHub設定
│   ├── workflows/            # GitHub Actions
│   ├── ISSUE_TEMPLATE/       # Issueテンプレート
│   └── SECURITY.md           # セキュリティポリシー
├── cli.ts                     # エントリーポイント
├── tsconfig.json             # TypeScript設定
├── package.json              # プロジェクト設定
├── README.md                 # 日本語ドキュメント
├── README.en.md              # 英語ドキュメント
├── CHANGELOG.md              # 変更履歴
├── CONTRIBUTING.md           # 貢献ガイドライン
└── USER_TASKS.md             # ユーザータスク一覧
```

## Recent Updates

### 2025-12-06: TypeScript 移行

- 全ソースコードを TypeScript に移行
- 型安全性の向上とコード品質の改善
- MCP SDK の型定義を活用
- ビルドプロセスの導入（`pnpm build`）

### 2025-12-06: リリース自動化の導入

- release-please による自動リリース管理を導入
- pkg-pr-new による PR プレビューパッケージ機能を追加
- Conventional Commits ルールを必須化
- commitlint によるコミットメッセージの自動検証を追加

### 2025-08-04: npm OIDC対応

- npm OIDCが正式リリースされたため、トークンベースからOIDCベースのリリースに移行
- GitHub Environmentsを使用したセキュアなリリースプロセスを導入
- `production`環境を使用し、承認ワークフローの追加が可能に
- ドキュメントを更新し、OIDC設定手順を詳細化

### 2025-06-28: アーキテクチャの大幅改善

- モジュール化によるコードの分離
- 依存性注入パターンの採用
- 100%のテストカバレッジ達成

### CI/CDの整備

- GitHub Actions（CI、リリース、セキュリティ）
- ~~OIDC による安全な npm 公開~~ → 2025-08-04に実装完了
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

### リリースプロセス（release-please による自動化）

1. Conventional Commits 形式でコミット
2. main ブランチにマージすると release-please が自動でリリース PR を作成
3. リリース PR をマージすると自動的に npm へ公開

### Conventional Commits ルール

**必須**: すべてのコミットメッセージは以下の形式に従うこと。

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

#### Type（必須）

| Type | 説明 | リリースへの影響 |
|------|------|-----------------|
| `feat` | 新機能の追加 | minor バージョンアップ |
| `fix` | バグ修正 | patch バージョンアップ |
| `docs` | ドキュメントのみの変更 | リリースなし |
| `style` | コードの意味に影響しない変更（空白、フォーマット等） | リリースなし |
| `refactor` | バグ修正でも機能追加でもないコード変更 | リリースなし |
| `perf` | パフォーマンス改善 | patch バージョンアップ |
| `test` | テストの追加・修正 | リリースなし |
| `build` | ビルドシステムや外部依存の変更 | リリースなし |
| `ci` | CI 設定ファイルやスクリプトの変更 | リリースなし |
| `chore` | その他の変更（src や test を含まない） | リリースなし |

#### Scope（任意）

変更の影響範囲を示す。例: `slack-client`, `mcp-server`, `deps`

#### Breaking Changes

破壊的変更がある場合は、type の後に `!` を付けるか、footer に `BREAKING CHANGE:` を記載。

```
feat!: remove deprecated API endpoint

BREAKING CHANGE: The /v1/send endpoint has been removed. Use /v2/send instead.
```

#### コミットメッセージ例

```bash
# 新機能
feat(slack-client): add support for message formatting

# バグ修正
fix(mcp-server): handle connection timeout properly

# ドキュメント
docs: update README with new configuration options

# 依存関係の更新
chore(deps): bump @modelcontextprotocol/sdk to v1.1.0

# 破壊的変更を含む修正
fix!: change webhook URL environment variable name
```

## コーディング規約

- Biome によるリント・フォーマット（`pnpm lint` でチェック）
- インデント: スペース2つ
- 文字列: シングルクォート
- セミコロン: 必須
- 改行コード: LF
- TypeScript: strict モードを使用
