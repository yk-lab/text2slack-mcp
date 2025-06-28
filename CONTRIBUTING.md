# Contributing to text2slack-mcp

First off, thank you for considering contributing to text2slack-mcp!
It's people like you that make text2slack-mcp such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one.
When you are creating a bug report, please include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps which reproduce the problem
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed after following the steps
- Explain which behavior you expected to see instead and why
- Include details about your configuration and environment

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- Use a clear and descriptive title
- Provide a step-by-step description of the suggested enhancement
- Provide specific examples to demonstrate the steps
- Describe the current behavior and explain which behavior you expected to see instead
- Explain why this enhancement would be useful

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes (`pnpm test`)
5. Make sure your code lints (`pnpm lint`)
6. Issue that pull request!

## Development Setup

1. Clone your fork:

   ```bash
   git clone https://github.com/your-username/text2slack-mcp.git
   cd text2slack-mcp
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Create a `.env` file for local testing:

   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

4. Run tests:

   ```bash
   pnpm test           # Run all tests
   pnpm test:unit      # Run unit tests only
   pnpm test:integration # Run integration tests
   pnpm test:coverage  # Run tests with coverage
   ```

5. Lint your code:

   ```bash
   pnpm lint          # Check for linting errors
   pnpm lint:fix      # Fix linting errors automatically
   ```

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### JavaScript Styleguide

- Use ES modules syntax
- 2 spaces for indentation
- Single quotes for strings
- Always use semicolons
- Follow the ESLint configuration in the project

### Testing

- Write tests for any new functionality
- Ensure all tests pass before submitting PR
- Aim for high test coverage (current: 100%)
- Use descriptive test names

## Project Structure

```plain
text2slack-mcp/
├── src/
│   ├── services/      # Business logic (SlackClient)
│   ├── tools/         # MCP tool definitions
│   └── server/        # MCP server implementation
├── test/
│   ├── services/      # Unit tests for services
│   ├── tools/         # Unit tests for tools
│   └── integration/   # Integration tests
└── cli.js            # Entry point
```

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing! 🎉
