# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2025-06-28

### Fixed

- Documentation updates for release process
- Updated CHANGELOG format

## [0.1.0] - 2025-06-28

### Added

- Initial release of text2slack-mcp
- MCP server implementation for sending messages to Slack
- Support for Slack incoming webhooks
- Comprehensive test suite with 100% coverage
- GitHub Actions for CI/CD, security scanning, and automated releases
- ESLint configuration for code quality
- Integration tests for end-to-end testing
- Modular architecture with separation of concerns
- OIDC-based npm publishing with provenance
- Qlty integration for continuous code quality monitoring
- Codecov integration for coverage tracking
- Node.js 18, 20, 22 support matrix
- Dependabot configuration for dependency updates
- Security policy and vulnerability reporting process
- Issue and PR templates for better collaboration
- Comprehensive documentation (README, CONTRIBUTING, SECURITY)

### Security

- Environment variable validation for webhook URL
- No sensitive data logging
- Secure HTTPS communication with Slack API
- OIDC authentication for npm publishing (no long-lived tokens)
- CodeQL analysis for security vulnerabilities
- Automated dependency auditing

### Developer Experience

- Modular code structure for better testability
- 100% test coverage for core modules
- Automatic code formatting with ESLint
- Development environment configuration (.vscode/settings.json)
- Clear contribution guidelines
- Japanese language support in documentation
- Code of Conduct (Contributor Covenant v2.0)
- English documentation (README.en.md)
- Issue template for Code of Conduct violations

[Unreleased]: https://github.com/yk-lab/text2slack-mcp/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/yk-lab/text2slack-mcp/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/yk-lab/text2slack-mcp/releases/tag/v0.1.0
