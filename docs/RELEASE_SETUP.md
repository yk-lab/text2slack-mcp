# Release Setup Guide

## Overview

This project uses npm OIDC (OpenID Connect) for secure, token-less automated publishing via GitHub Actions.
All releases include automatic cryptographic provenance attestation.

## OIDC Setup

### Important Note

As of July 31, 2025, npm's OIDC (OpenID Connect) feature for GitHub Actions is now generally available!
This eliminates the need for long-lived npm tokens, providing enhanced security and automatic provenance.

### Benefits

- **No long-lived tokens** in GitHub Secrets
- **Automatic provenance** attestation
- **Enhanced security** with short-lived, workflow-specific credentials
- **Better auditability** and trust verification
- **No token rotation** required

### Setup Steps

1. **Configure npm Trusted Publishers**

   - Log in to your npm account at [npmjs.com](https://www.npmjs.com)
   - Navigate to the package page: `https://www.npmjs.com/package/text2slack-mcp`
   - Go to "Settings" → "Publishing access"
   - Click "Configure trusted publishers"
   - Add GitHub Actions as trusted publisher:
     - **Repository**: `yk-lab/text2slack-mcp`
     - **Workflow**: `.github/workflows/release.yml`
     - **Environment**: `production` (recommended for additional security)
   - Click "Add publisher"

2. **Configure GitHub Environment (Recommended)**

   - Go to your GitHub repository
   - Navigate to Settings → Environments
   - Click "New environment"
   - Name: `production`
   - Configure protection rules (optional but recommended):
     - **Required reviewers**: Add trusted team members
     - **Deployment branches**: Only allow tags matching `v*`
   - Click "Save protection rules"

3. **Verify GitHub Actions Configuration**

   The `.github/workflows/release.yml` is configured to use OIDC:

   ```yaml
   permissions:
     contents: write
     id-token: write  # Required for OIDC

   jobs:
     publish:
       environment: production  # Uses the configured environment
   ```

## Legacy: NPM Token Setup (Not Recommended)

### When to Use Tokens

Only use npm tokens if:

- You haven't configured OIDC yet
- You need to publish from outside GitHub Actions
- You're troubleshooting OIDC issues

### Setup Steps

1. **Create npm Access Token**

   - Log in to your npm account at [npmjs.com](https://www.npmjs.com)
   - Go to Account Settings → Access Tokens
   - Click "Generate New Token" → "Classic Token"
   - Select "Automation" type
   - Copy the generated token (starts with `npm_`)

2. **Add Token to GitHub Secrets**

   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

3. **Update Workflow**

   Add the token to your workflow:

   ```yaml
   - name: Publish to npm
     env:
       NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
   ```

### How OIDC Works

1. GitHub Actions requests an OIDC token from GitHub
2. The token contains claims about the workflow, repository, ref, and environment
3. npm validates the token against configured trusted publishers
4. If valid, npm allows the publish without requiring an auth token
5. Provenance statement is automatically generated and signed

### Troubleshooting

#### Error: "OIDC token verification failed"

- Ensure the repository and workflow path match exactly in npm settings
- Check that `id-token: write` permission is set in the workflow
- Verify the environment name matches (if configured)
- Check that the workflow is running from the correct repository

#### Error: "No trusted publishers configured"

- Go to npm package settings and configure trusted publishers
- Ensure you're logged in with the correct npm account
- Verify you have publish permissions for the package

#### Error: "Package version doesn't match tag"

- Update package.json version to match the tag (without 'v' prefix)
- Example: tag `v1.0.0` requires package.json version `1.0.0`

#### Error: "Environment protection rules not satisfied"

- Check GitHub environment settings
- Ensure required reviewers have approved (if configured)
- Verify the tag matches allowed deployment branches

## Prerequisites

1. npm account with 2FA enabled
2. npm package already published (OIDC can't be used for first publish)
3. Public GitHub repository
4. Repository owner has permissions to configure npm trusted publishers

## Release Process

### Standard Release Process

```bash
# 1. Update version in package.json
npm version patch  # or minor, major

# 2. Update CHANGELOG.md

# 3. Commit and push
git add .
git commit -m "chore: release v0.1.1"
git push

# 4. Create and push tag
git tag v0.1.1
git push origin v0.1.1
```

### Manual Release (if needed)

```bash
# Use workflow_dispatch in GitHub Actions UI
# Enter the tag name (e.g., v1.0.0)
```

## Security Best Practices

1. **Use OIDC instead of tokens** whenever possible
2. **Configure environment protection** for production releases
3. **Limit trusted publishers** to specific workflows and environments
4. **Monitor npm audit log** for unauthorized publishes
5. **Enable 2FA** on npm account
6. **Review trusted publishers** regularly and remove unused ones

## References

- [npm Trusted Publishers Documentation](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub OIDC for npm](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [npm OIDC Announcement](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
