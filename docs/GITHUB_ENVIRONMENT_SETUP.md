# GitHub Environment Setup Guide

## Overview

GitHub Environmentsは、デプロイメントの制御とセキュリティを強化するための機能です。
npm OIDCと組み合わせることで、より安全なリリースプロセスを実現できます。

## なぜEnvironmentを使うのか？

### セキュリティ上の利点

1. **デプロイメント制御**
   - 特定のブランチやタグからのみリリース可能
   - 誤ったブランチからの公開を防止

2. **承認ワークフロー**
   - リリース前に手動承認を要求可能
   - 重要な変更の二重チェック

3. **監査証跡**
   - すべてのデプロイメントが記録される
   - いつ、誰が、何をリリースしたか追跡可能

4. **OIDC統合**
   - npm trusted publishersで環境を指定
   - より細かい権限制御

## セットアップ手順

### 1. GitHub Environmentの作成

1. GitHubリポジトリの **Settings** タブを開く
2. 左メニューから **Environments** を選択
3. **New environment** をクリック
4. 環境名に `production` を入力
5. **Configure environment** をクリック

### 2. 保護ルールの設定（推奨）

#### デプロイメントブランチ

- **Deployment branches** セクションで設定
- 推奨設定：
  ```
  Selected branches and tags
  - Add deployment branch rule
  - Pattern: v*
  ```
  これにより、`v` で始まるタグからのみデプロイ可能

#### 必須レビュアー

- **Required reviewers** にチェック
- 信頼できるチームメンバーを追加
- リリース前に承認が必要になる

#### 待機タイマー（オプション）

- **Wait timer** で遅延を設定
- 緊急時のロールバック時間を確保

### 3. ワークフローでの使用

```yaml
jobs:
  publish:
    runs-on: ubuntu-latest
    environment: production  # ここで環境を指定

    steps:
      # ... 以下、通常のステップ
```

### 4. npm Trusted Publishersの設定

npmのパッケージ設定で、環境名も含めて登録：

- **Repository**: `yk-lab/text2slack-mcp`
- **Workflow**: `.github/workflows/release.yml`
- **Environment**: `production` ← これを追加

## ベストプラクティス

### 複数環境の活用

```yaml
# 開発版リリース用
environment: development

# 本番リリース用
environment: production
```

### 環境変数の管理

各環境で異なる設定が必要な場合：

1. Environment secretsを使用
2. 環境ごとに異なる値を設定
3. ワークフローで `${{ secrets.ENV_SPECIFIC_SECRET }}` として参照

### 緊急リリース対応

保護ルールを一時的にバイパスする場合：

1. 管理者権限で **Bypass protection rules** を使用
2. 理由を明確にコミットメッセージに記載
3. 事後レビューを実施

## トラブルシューティング

### 「Environment not found」エラー

- 環境名のタイプミスを確認
- 環境が実際に作成されているか確認

### 承認待ちで止まる

- Required reviewersが設定されている
- 指定されたレビュアーに承認を依頼

### OIDCエラー

- npm trusted publishersの環境名が一致しているか確認
- ワークフローのenvironment指定を確認

## 参考リンク

- [Using environments for deployment - GitHub Docs](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Environment protection rules - GitHub Docs](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment#environment-protection-rules)
