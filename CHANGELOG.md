# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0](https://github.com/yk-lab/text2slack-mcp/compare/v0.1.3...v1.0.0) (2026-02-14)


### ⚠ BREAKING CHANGES

* npm publishing now requires OIDC trusted publisher configuration

### Features

* add JUnit test results reporting to CI workflow ([#8](https://github.com/yk-lab/text2slack-mcp/issues/8)) ([e2e7fa9](https://github.com/yk-lab/text2slack-mcp/commit/e2e7fa9c6303041ac05cbda6a071be4c8d328a17))
* add release-please and pkg-pr-new for automated releases ([#73](https://github.com/yk-lab/text2slack-mcp/issues/73)) ([7e1acd5](https://github.com/yk-lab/text2slack-mcp/commit/7e1acd557f8f6ff842654eb56322870cab6f4219))
* **logger:** add structured logging for debugging and monitoring ([#113](https://github.com/yk-lab/text2slack-mcp/issues/113)) ([49330c2](https://github.com/yk-lab/text2slack-mcp/commit/49330c23a6206c7174f698a21c1e45700892c0fe))
* migrate codebase to TypeScript ([#77](https://github.com/yk-lab/text2slack-mcp/issues/77)) ([87a08bc](https://github.com/yk-lab/text2slack-mcp/commit/87a08bc1c809815d24d9b93711bdc758e3702e6e))
* migrate npm publishing from token-based to OIDC authentication ([#21](https://github.com/yk-lab/text2slack-mcp/issues/21)) ([c110ae8](https://github.com/yk-lab/text2slack-mcp/commit/c110ae840dd28ba1eab3a1c590534136ff797a5b))
* **slack-client:** add retry logic with exponential backoff ([#101](https://github.com/yk-lab/text2slack-mcp/issues/101)) ([90ae111](https://github.com/yk-lab/text2slack-mcp/commit/90ae1117a2aee0c207014376ee0417922de27ae5))
* **validation:** add comprehensive webhook URL and message validation ([#114](https://github.com/yk-lab/text2slack-mcp/issues/114)) ([bd0a604](https://github.com/yk-lab/text2slack-mcp/commit/bd0a60444df1e543fa9448011c72e9be1f4dad58))


### Bug Fixes

* **mcp-server:** add graceful shutdown and signal handling ([#99](https://github.com/yk-lab/text2slack-mcp/issues/99)) ([e14fdf6](https://github.com/yk-lab/text2slack-mcp/commit/e14fdf659f11c3eafbb72a7bd6131c0751124e3a))
* **mcp-server:** read version from package.json instead of hardcoding ([#95](https://github.com/yk-lab/text2slack-mcp/issues/95)) ([928aaf9](https://github.com/yk-lab/text2slack-mcp/commit/928aaf9219b4a7ac360b8d4320f92c0af512a165)), closes [#79](https://github.com/yk-lab/text2slack-mcp/issues/79)
* optimize CI coverage workflow and add lcov.info to ignore files ([#7](https://github.com/yk-lab/text2slack-mcp/issues/7)) ([1cbf630](https://github.com/yk-lab/text2slack-mcp/commit/1cbf6304db5ddcb19b7bdeeb6c601abed1b343c6))
* replace dependabot reviewers with CODEOWNERS ([#5](https://github.com/yk-lab/text2slack-mcp/issues/5)) ([5c6f8c2](https://github.com/yk-lab/text2slack-mcp/commit/5c6f8c240d6fd050d8990e039f99fd4f08230d90))
* **slack-client:** add fetch timeout for Slack API calls ([#94](https://github.com/yk-lab/text2slack-mcp/issues/94)) ([daa79cf](https://github.com/yk-lab/text2slack-mcp/commit/daa79cfbaadf6f165782c3b921a5653560ed118e)), closes [#78](https://github.com/yk-lab/text2slack-mcp/issues/78)

## [Unreleased]

### Changed

- Optimized CI workflow by removing duplicate test execution
- Updated test:coverage script to generate LCOV format coverage reports and JUnit XML test results
- Dropped support for Node.js 18.x (reached End-of-Life)
- Minimum supported Node.js version is now 20.x
- CI now runs coverage tests only on Node.js 20.x and standard tests on 22.x for faster feedback
- **BREAKING**: Migrated from npm token-based authentication to OIDC for automated releases (August 2025)
- Updated release workflow to use GitHub Environments for enhanced security

### Added

- LCOV format coverage report generation for better IDE integration
- JUnit XML test results reporting for Codecov test analytics
- Explicit coverage file paths for Codecov and Qlty uploads
- GitHub Environment setup documentation (`docs/GITHUB_ENVIRONMENT_SETUP.md`)
- npm OIDC trusted publishers configuration for token-less publishing

### Fixed

- CI workflow now correctly generates and uploads coverage reports
- Coverage files properly excluded from Git and npm packages

### Security

- Eliminated long-lived npm tokens by adopting OIDC authentication
- Added GitHub Environment protection for production releases
- Automatic provenance attestation with OIDC publishing

## [0.1.3] - 2025-06-28

### Changed

- Switched from OIDC to NPM_TOKEN for automated releases due to npm OIDC feature still being in development
- Updated release workflow to use `NODE_AUTH_TOKEN` environment variable
- Updated documentation to reflect the token-based authentication approach

### Fixed

- Added `--no-git-checks` flag to npm publish command in GitHub Actions
- Fixed automated release authentication by using npm access tokens

## [0.1.2] - 2025-06-28

### Fixed

- Initial OIDC configuration for npm publishing

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

[Unreleased]: https://github.com/yk-lab/text2slack-mcp/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/yk-lab/text2slack-mcp/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/yk-lab/text2slack-mcp/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/yk-lab/text2slack-mcp/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/yk-lab/text2slack-mcp/releases/tag/v0.1.0
