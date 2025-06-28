# Security Policy

## Supported Versions

Currently supported versions of text2slack-mcp:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of text2slack-mcp seriously.
If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. Email: Create an issue with title "[SECURITY]" and we'll provide a secure communication channel
2. GitHub Security Advisory: Use GitHub's private vulnerability reporting feature

### What to Include

Please include the following information:

- Type of issue (e.g., buffer overflow, authentication bypass, etc.)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Initial Assessment**: Within 5 business days, we'll provide an initial assessment
- **Resolution Timeline**: We aim to resolve critical issues within 30 days
- **Updates**: We'll keep you informed about the progress

### Safe Harbor

Any activities conducted in a manner consistent with this policy will be considered authorized conduct
and we will not initiate legal action against you.
If legal action is initiated by a third party against you in connection with activities conducted under this policy,
we will take steps to make it known that your actions were conducted in compliance with this policy.

## Security Best Practices for Users

1. **Webhook URL Security**:

   - Never commit your Slack webhook URL to version control
   - Use environment variables or secure configuration management
   - Rotate webhook URLs periodically
   - Use webhook URLs with minimum required permissions

2. **Environment Security**:

   - Run the MCP server in a secure environment
   - Limit network access to only necessary services
   - Keep dependencies up to date

3. **Updates**:
   - Regularly update to the latest version
   - Monitor security advisories
   - Enable Dependabot alerts on your fork

Thank you for helping keep text2slack-mcp and its users safe!
