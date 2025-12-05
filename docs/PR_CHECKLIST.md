# PR チェックリスト

このドキュメントでは、PR のレビュー依頼前、マージ前、リリース前に確認すべき項目を説明します。

## レビュー依頼前の確認

### 1. ローカルでのテスト

```bash
# すべてのテストを実行
pnpm test

# カバレッジを確認（100% を維持）
pnpm test:coverage

# Lint チェック
pnpm lint
```

### 2. コミットメッセージの確認

Conventional Commits 形式に従っているか確認:

```bash
# 最新のコミットメッセージを確認
git log --oneline -5

# コミットメッセージの形式
# feat: 新機能
# fix: バグ修正
# docs: ドキュメント
# chore: その他
```

### 3. 変更内容の自己レビュー

```bash
# 変更差分を確認
git diff main...HEAD

# 変更ファイル一覧
git diff --name-only main...HEAD
```

## マージ前の確認

### 1. CI の確認

- [ ] すべての CI チェックが成功している
- [ ] テストカバレッジが低下していない
- [ ] Lint エラーがない

### 2. pkg-pr-new でのプレビューテスト

PR が作成されると、pkg-pr-new が自動的にプレビューパッケージを公開します。
このパッケージを使って実際の動作を確認できます。

#### プレビューパッケージのインストール

```bash
# PR 番号を指定してインストール
npm install https://pkg.pr.new/yk-lab/text2slack-mcp@<PR番号>

# 例: PR #42 の場合
npm install https://pkg.pr.new/yk-lab/text2slack-mcp@42
```

#### MCP Inspector での動作確認

[MCP Inspector](https://github.com/modelcontextprotocol/inspector) を使用して、MCP サーバーの動作を確認します。

```bash
# MCP Inspector をインストール（初回のみ）
npm install -g @modelcontextprotocol/inspector

# プレビューパッケージで Inspector を起動
npx @modelcontextprotocol/inspector https://pkg.pr.new/yk-lab/text2slack-mcp@<PR番号>
```

#### Inspector での確認項目

1. **ツール一覧の確認**
   - `send_to_slack` ツールが表示されること
   - ツールの説明とパラメータが正しいこと

2. **ツール実行テスト**
   - `send_to_slack` ツールを実行
   - Slack にメッセージが送信されることを確認
   - エラーハンドリングが正しく動作することを確認

3. **エラーケースの確認**
   - 空のメッセージを送信した場合のエラー
   - 無効な Webhook URL の場合のエラー

### 3. 手動での動作確認（オプション）

より詳細なテストが必要な場合:

```bash
# 一時ディレクトリで確認
cd $(mktemp -d)

# プレビューパッケージをインストール
npm init -y
npm install https://pkg.pr.new/yk-lab/text2slack-mcp@<PR番号>

# 環境変数を設定して実行
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  npx text2slack-mcp
```

## リリース前の確認

release-please が自動的にリリース PR を作成した後、マージ前に以下を確認します。

### 1. リリース PR の内容確認

- [ ] バージョン番号が適切（semver に従っている）
- [ ] CHANGELOG.md の内容が正確
- [ ] 破壊的変更がある場合は BREAKING CHANGE として記載されている

### 2. 最終動作確認

リリース PR にも pkg-pr-new でプレビューパッケージが作成されます。
これを使用して最終確認を行います。

```bash
# リリース PR のプレビューパッケージをテスト
npm install https://pkg.pr.new/yk-lab/text2slack-mcp@<リリースPR番号>

# Inspector で動作確認
npx @modelcontextprotocol/inspector https://pkg.pr.new/yk-lab/text2slack-mcp@<リリースPR番号>
```

### 3. セキュリティ確認

```bash
# 依存関係の脆弱性チェック
pnpm audit

# 高リスクの脆弱性がないことを確認
```

## チェックリストまとめ

### レビュー依頼前

- [ ] `pnpm test` が成功
- [ ] `pnpm lint` がエラーなし
- [ ] コミットメッセージが Conventional Commits 形式
- [ ] 変更差分を自己レビュー済み

### マージ前

- [ ] CI がすべて成功
- [ ] pkg-pr-new のプレビューパッケージで動作確認
- [ ] MCP Inspector でツールが正しく動作
- [ ] レビュアーの承認を取得

### リリース前

- [ ] リリース PR の内容を確認
- [ ] バージョン番号が適切
- [ ] CHANGELOG.md が正確
- [ ] プレビューパッケージで最終動作確認
- [ ] セキュリティ脆弱性がない

## トラブルシューティング

### pkg-pr-new のパッケージが見つからない

- PR の CI が完了しているか確認
- preview ワークフローが成功しているか確認
- 数分待ってから再試行

### Inspector が起動しない

```bash
# Inspector を最新版に更新
npm install -g @modelcontextprotocol/inspector@latest

# Node.js のバージョンを確認（18 以上が必要）
node --version
```

### Webhook エラーが発生する

- `SLACK_WEBHOOK_URL` が正しく設定されているか確認
- Webhook URL が有効か確認（Slack の設定画面で確認）

## 関連ドキュメント

- [RELEASE.md](./RELEASE.md) - リリースプロセスの詳細
- [CONTRIBUTING.md](../CONTRIBUTING.md) - 貢献ガイドライン
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector) - MCP デバッグツール
