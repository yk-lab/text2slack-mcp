# リリースガイド

## 概要

このプロジェクトでは **release-please** による自動リリース管理と **npm OIDC**（OpenID Connect）によるセキュアなトークンレス公開を GitHub Actions で実現しています。
すべてのリリースには自動的に暗号学的な来歴証明（provenance attestation）が付与されます。

### リリース自動化ツール

- **release-please**: Conventional Commits に基づいてリリース PR を自動作成
- **pkg-pr-new**: PR ごとにプレビューパッケージを公開し、マージ前にテスト可能

## OIDC 設定

### 重要な注意事項

2025年7月31日より、npm の OIDC（OpenID Connect）機能が正式リリースされました。
これにより長期間有効なトークンが不要となり、セキュリティの向上と自動来歴証明が実現されています。

### メリット

- GitHub Secrets に**長期トークンが不要**
- **自動来歴証明**（provenance attestation）
- ワークフロー固有の短期認証情報による**セキュリティ強化**
- **監査性の向上**と信頼性検証
- **トークンローテーション不要**

### セットアップ手順

1. **npm Trusted Publishers の設定**

   - [npmjs.com](https://www.npmjs.com) で npm アカウントにログイン
   - パッケージページに移動: `https://www.npmjs.com/package/text2slack-mcp`
   - "Settings" → "Publishing access" を選択
   - "Configure trusted publishers" をクリック
   - GitHub Actions を trusted publisher として追加:
     - **Repository**: `yk-lab/text2slack-mcp`
     - **Workflow**: `.github/workflows/release-please.yml`
     - **Environment**: `production`（セキュリティ強化のため推奨）
   - "Add publisher" をクリック

2. **GitHub Environment の設定（推奨）**

   - GitHub リポジトリに移動
   - Settings → Environments を選択
   - "New environment" をクリック
   - 名前: `production`
   - 保護ルールを設定（任意だが推奨）:
     - **Required reviewers**: 信頼できるチームメンバーを追加
     - **Deployment branches**: `v*` に一致するタグのみ許可
   - "Save protection rules" をクリック

3. **GitHub Actions 設定の確認**

   `.github/workflows/release-please.yml` は OIDC を使用するよう設定されています:

   ```yaml
   permissions:
     contents: write
     pull-requests: write
     id-token: write  # OIDC に必要（publish ジョブ内）

   jobs:
     release-please:
       # リリース PR を自動作成
     publish:
       needs: release-please
       if: ${{ needs.release-please.outputs.release_created }}
       environment: production  # 設定した環境を使用
   ```

## レガシー: NPM トークン設定（非推奨）

### トークンを使用するケース

以下の場合のみ npm トークンを使用してください:

- OIDC をまだ設定していない
- GitHub Actions 以外から公開する必要がある
- OIDC の問題をトラブルシューティング中

### セットアップ手順

1. **npm アクセストークンの作成**

   - [npmjs.com](https://www.npmjs.com) で npm アカウントにログイン
   - Account Settings → Access Tokens に移動
   - "Generate New Token" → "Classic Token" をクリック
   - "Automation" タイプを選択
   - 生成されたトークンをコピー（`npm_` で始まる）

2. **GitHub Secrets にトークンを追加**

   - GitHub リポジトリに移動
   - Settings → Secrets and variables → Actions を選択
   - "New repository secret" をクリック
   - Name: `NPM_TOKEN`
   - Value: npm トークンを貼り付け
   - "Add secret" をクリック

3. **ワークフローの更新**

   トークンをワークフローに追加:

   ```yaml
   - name: Publish to npm
     env:
       NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
   ```

### OIDC の仕組み

1. GitHub Actions が GitHub から OIDC トークンを要求
2. トークンにはワークフロー、リポジトリ、ref、環境に関する情報が含まれる
3. npm が設定された trusted publishers に対してトークンを検証
4. 有効な場合、認証トークンなしで公開を許可
5. 来歴証明が自動的に生成・署名される

### トラブルシューティング

#### エラー: "OIDC token verification failed"

- npm 設定でリポジトリとワークフローパスが正確に一致しているか確認
- ワークフローに `id-token: write` 権限が設定されているか確認
- 環境名が一致しているか確認（設定している場合）
- ワークフローが正しいリポジトリから実行されているか確認

#### エラー: "No trusted publishers configured"

- npm パッケージ設定で trusted publishers を設定
- 正しい npm アカウントでログインしているか確認
- パッケージの公開権限があるか確認

#### エラー: "Package version doesn't match tag"

- package.json のバージョンをタグと一致させる（'v' プレフィックスなし）
- 例: タグ `v1.0.0` には package.json のバージョン `1.0.0` が必要

#### エラー: "Environment protection rules not satisfied"

- GitHub の環境設定を確認
- 必要なレビュアーが承認しているか確認（設定している場合）
- タグが許可されたデプロイブランチと一致しているか確認

## 前提条件

1. 2FA が有効な npm アカウント
2. 既に公開済みの npm パッケージ（OIDC は初回公開には使用不可）
3. パブリック GitHub リポジトリ
4. npm trusted publishers を設定する権限

## リリースプロセス

### release-please による自動リリース

このプロジェクトでは **release-please** による完全自動リリースを使用しています:

1. **Conventional Commits で変更をコミット**

   ```bash
   git commit -m "feat: 新機能を追加"
   git commit -m "fix: バグを修正"
   ```

2. **main ブランチにマージ**

   - release-please がリリース PR を自動作成/更新
   - PR にはバージョン更新と CHANGELOG の変更が含まれる

3. **リリース PR をマージ**

   - マージにより OIDC を使用した npm 公開が自動実行
   - GitHub Release が自動作成される

### Conventional Commits フォーマット

```text
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

| Type | 説明 | リリースへの影響 |
|------|------|-----------------|
| `feat` | 新機能 | minor バージョン |
| `fix` | バグ修正 | patch バージョン |
| `feat!` または `BREAKING CHANGE:` | 破壊的変更 | major バージョン |
| `docs`, `chore`, `ci` など | その他の変更 | リリースなし |

### pkg-pr-new でのテスト

マージ前に、任意の PR からパッケージをテストできます:

```bash
# PR からプレビューパッケージをインストール
npm install https://pkg.pr.new/text2slack-mcp@<PR番号>
```

### 手動リリース（レガシー）

必要に応じて手動でリリースすることも可能です:

```bash
# 1. package.json のバージョンを更新
npm version patch  # または minor, major

# 2. CHANGELOG.md を更新

# 3. コミットしてプッシュ
git add .
git commit -m "chore: release v0.1.1"
git push

# 4. タグを作成してプッシュ
git tag v0.1.1
git push origin v0.1.1
```

## セキュリティベストプラクティス

1. 可能な限り**トークンではなく OIDC を使用**
2. 本番リリースには**環境保護を設定**
3. **trusted publishers を特定のワークフローと環境に限定**
4. 不正な公開がないか **npm 監査ログを監視**
5. npm アカウントで **2FA を有効化**
6. **trusted publishers を定期的にレビュー**し、未使用のものを削除

## 参考資料

- [npm Trusted Publishers ドキュメント](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub OIDC for npm](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [npm OIDC 発表](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
