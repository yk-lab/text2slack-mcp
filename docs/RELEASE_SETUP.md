# Release Setup Guide

## Overview

This project uses npm access tokens for automated publishing via GitHub Actions.
All releases include cryptographic provenance attestation.

## NPM Token Setup

### Important Note

As of June 2025, npm's OIDC (OpenID Connect) feature for GitHub Actions is still in development.
See [GitHub community discussion](https://github.com/orgs/community/discussions/161015) for the latest status.
Until OIDC is fully available, we use traditional npm tokens for automated releases.

### Setup Steps

1. **Create npm Access Token**

   - Log in to your npm account at [npmjs.com](https://www.npmjs.com)
   - Go to Account Settings → Access Tokens
   - Click "Generate New Token" → "Classic Token"
   - Select "Automation" type (recommended for CI/CD)
   - Copy the generated token (starts with `npm_`)

2. **Add Token to GitHub Secrets**

   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

3. **Verify GitHub Actions Configuration**

   The `.github/workflows/release.yml` is already configured to use the NPM_TOKEN:
   ```yaml
   env:
     NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
   ```

## OIDC Setup (Future - Currently Not Available)

### Benefits

- No long-lived tokens in GitHub Secrets
- Cryptographically signed provenance
- Better security and auditability
- Automatic trust verification

### Setup Steps

1. **Configure npm Trusted Publishers**

   - Go to your npm account settings
   - Navigate to "Publishing" > "Trusted Publishers"
   - Add GitHub Actions as trusted publisher:
     - Repository: `yk-lab/text2slack-mcp`
     - Workflow: `.github/workflows/release.yml`
     - Environment: (leave empty for default)

2. **Enable Provenance in npm**

   - In package settings, enable "Require provenance"
   - This ensures all publishes have cryptographic attestation

3. **Enable Provenance in npm**

   - In package settings, enable "Require provenance"
   - This ensures all publishes have cryptographic attestation

4. **Test the Setup**

   ```bash
   # Create a test tag
   git tag v0.1.1-beta.1
   git push origin v0.1.1-beta.1
   ```

### How OIDC Will Work (When Available)

1. GitHub Actions requests an OIDC token from GitHub
2. The token contains claims about the workflow, repository, and ref
3. npm validates the token against configured trusted publishers
4. If valid, npm allows the publish without requiring an auth token
5. Provenance statement is automatically generated and signed

### Troubleshooting

#### Error: "OIDC token verification failed"

- Ensure the repository and workflow path match exactly in npm settings
- Check that `id-token: write` permission is set in the workflow

#### Error: "Package version doesn't match tag"

- Update package.json version to match the tag (without 'v' prefix)
- Example: tag `v1.0.0` requires package.json version `1.0.0`

## Prerequisites

1. npm account with 2FA enabled
2. npm access token (Automation type) stored in GitHub Secrets as `NPM_TOKEN`
3. Public GitHub repository
4. Repository and npm package names must match

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

1. **Never commit tokens** to the repository
2. **Use minimal permissions** for any tokens
3. **Rotate tokens regularly** - npm tokens should be rotated every 90 days
4. **Monitor npm audit log** for unauthorized publishes
5. **Enable 2FA** on npm account

## References

- [npm Trusted Publishers](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub OIDC for npm](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [npm Provenance](https://github.blog/2023-04-19-introducing-npm-package-provenance/)
