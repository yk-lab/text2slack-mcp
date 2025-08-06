# リリース手順

このドキュメントでは、text2slack-mcpのリリース手順について説明します。

## 前提条件

- リポジトリの管理者権限を持っていること
- npmアカウントを持っていること（公開パッケージの場合）
- GitHub Secretsが適切に設定されていること

## リリースフロー

### 1. リリース準備

#### 1.1 リリースブランチの作成

```bash
# mainブランチから最新を取得
git checkout main
git pull origin main

# リリース用のブランチを作成
git checkout -b release/v新バージョン番号
```

#### 1.2 テストの実行

```bash
# 全テストを実行
pnpm test

# カバレッジを確認（100%を維持）
pnpm test:coverage

# Lintチェック
pnpm lint
```

### 2. バージョンの更新

#### 2.1 package.jsonのバージョン更新

```bash
# パッチバージョンの更新（例: 1.0.0 → 1.0.1）
npm version patch --no-git-tag-version

# マイナーバージョンの更新（例: 1.0.0 → 1.1.0）
npm version minor --no-git-tag-version

# メジャーバージョンの更新（例: 1.0.0 → 2.0.0）
npm version major --no-git-tag-version
```

#### 2.2 CHANGELOG.mdの更新

```markdown
## [新バージョン番号] - YYYY-MM-DD

### 追加
- 新機能の説明

### 変更
- 変更内容の説明

### 修正
- バグ修正の説明

### 削除
- 削除された機能の説明
```

### 3. プルリクエストの作成

```bash
# 変更をコミット
git add package.json CHANGELOG.md
git commit -m "chore: release v新バージョン番号"

# リリースブランチをプッシュ
git push origin release/v新バージョン番号

# GitHubでプルリクエストを作成
# タイトル: Release v新バージョン番号
# 説明: CHANGELOG.mdの内容をコピー
```

### 4. プルリクエストのマージとタグ付け

#### 4.1 プルリクエストのレビューとマージ

1. CI/CDが全て成功していることを確認
2. プルリクエストをマージ（Squash and mergeまたはMerge commit）

#### 4.2 タグの作成とプッシュ

```bash
# mainブランチに切り替えて最新を取得
git checkout main
git pull origin main

# タグを作成
git tag -a v新バージョン番号 -m "Release v新バージョン番号"

# タグをプッシュ（GitHub Actionsが自動的にnpmへ公開）
git push origin v新バージョン番号
```

### 5. 自動リリースの確認

タグをプッシュすると、GitHub Actionsが自動的に以下を実行します：

1. テストの実行
2. ビルドの確認
3. npmへの公開（OIDCを使用）

#### 5.1 GitHub Actionsの確認

- [Actions](https://github.com/yohasebe/text2slack-mcp/actions)ページでリリースワークフローの状態を確認
- 緑のチェックマークが表示されれば成功

#### 5.2 npmパッケージの確認

```bash
# npmに公開されたか確認
npm view text2slack-mcp

# 最新バージョンをインストールしてテスト
npx text2slack-mcp@latest
```

### 6. GitHubリリースの作成

1. [Releases](https://github.com/yohasebe/text2slack-mcp/releases)ページへアクセス
2. 「Draft a new release」をクリック
3. タグを選択（v新バージョン番号）
4. リリースタイトルを入力（例: Release v1.0.1）
5. CHANGELOG.mdの内容をコピーして説明欄に貼り付け
6. 「Publish release」をクリック

## トラブルシューティング

### npmへの公開が失敗する場合

#### OIDCの設定確認

1. GitHubリポジトリの設定を確認
2. npm側のOIDC設定を確認（[npm OIDC設定ガイド](docs/RELEASE_SETUP.md)参照）

#### GitHub Secretsの確認

- `NPM_PACKAGE_NAME`: パッケージ名が正しいか確認

### テストが失敗する場合

```bash
# ローカルでテストを実行
pnpm test

# 詳細なエラーログを確認
pnpm test -- --verbose
```

### バージョンコンフリクトが発生する場合

```bash
# package-lock.jsonを削除して再インストール
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## セマンティックバージョニング

バージョン番号は`MAJOR.MINOR.PATCH`の形式で管理します：

- **MAJOR**: 後方互換性のない変更
- **MINOR**: 後方互換性のある新機能
- **PATCH**: 後方互換性のあるバグ修正

### バージョン更新の判断基準

| 変更内容 | バージョン更新 | 例 |
|---------|--------------|-----|
| バグ修正、typo修正 | PATCH | 1.0.0 → 1.0.1 |
| 新機能追加（互換性あり） | MINOR | 1.0.0 → 1.1.0 |
| 破壊的変更、API変更 | MAJOR | 1.0.0 → 2.0.0 |

## チェックリスト

リリース前に以下を確認：

- [ ] すべてのテストが成功している
- [ ] コードカバレッジが100%を維持している
- [ ] Lintエラーがない
- [ ] CHANGELOG.mdが更新されている
- [ ] package.jsonのバージョンが更新されている
- [ ] ドキュメントが最新の状態になっている
- [ ] セキュリティの脆弱性がない（`pnpm audit`）

## 緊急リリース（ホットフィックス）

セキュリティ修正など緊急のリリースが必要な場合：

1. mainブランチからホットフィックスブランチを作成
2. 修正を実施してテストを実行
3. PATCHバージョンを更新
4. 緊急プルリクエストを作成

```bash
# 緊急修正の例
git checkout main
git pull origin main

# ホットフィックスブランチを作成
git checkout -b hotfix/security-fix

# 修正を実施
# ...

# テスト実行
pnpm test

# バージョン更新
npm version patch --no-git-tag-version

# CHANGELOG.mdを更新してコミット
git add -A
git commit -m "fix: 緊急セキュリティ修正"

# プルリクエストを作成
git push origin hotfix/security-fix

# マージ後、タグを作成してプッシュ
git checkout main
git pull origin main
git tag -a v新バージョン番号 -m "Hotfix: v新バージョン番号"
git push origin v新バージョン番号
```

## 関連ドキュメント

- [RELEASE_SETUP.md](./RELEASE_SETUP.md) - npm OIDCの設定方法
- [CONTRIBUTING.md](../CONTRIBUTING.md) - 貢献ガイドライン
- [CHANGELOG.md](../CHANGELOG.md) - 変更履歴

## お問い合わせ

リリースに関する質問や問題がある場合は、[Issues](https://github.com/yohasebe/text2slack-mcp/issues)でお知らせください。
