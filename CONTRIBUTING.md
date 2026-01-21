# Contributing to Codex MCP

Thank you for your interest in contributing to Codex MCP! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or later
- npm (comes with Node.js)
- OpenAI Codex CLI installed and authenticated
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/codex-mcp.git
   cd codex-mcp
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Run tests:
   ```bash
   npm test
   ```

## 📝 Development Workflow

### Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes
3. Run tests:
   ```bash
   npm test
   ```

4. Build to verify TypeScript compiles:
   ```bash
   npm run build
   ```

5. Commit your changes:
   ```bash
   git commit -m "feat: add your feature"
   ```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Build/tooling changes

**Examples:**
```
feat: add configurable timeout for agent execution
fix: prevent memory leak in output capture
docs: update README with reasoning effort examples
test: add tests for parallel agent spawning
```

### Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md with your changes
5. Push to your fork
6. Create a Pull Request with a clear description

**PR Title Format:**
```
feat: add support for custom codex flags
fix: resolve agent timeout issue
docs: improve troubleshooting guide
```

## ✅ Code Standards

### TypeScript

- Use TypeScript strict mode
- Add proper types (no `any` unless absolutely necessary)
- Document complex functions with JSDoc comments

### Testing

- Add tests for all new features
- Maintain 100% test pass rate
- Use descriptive test names

**Example:**
```typescript
describe("Reasoning Effort Feature", () => {
  it("should map extra_high to xhigh for API compatibility", () => {
    // Test implementation
  });
});
```

### Code Style

- Use 2 spaces for indentation
- Use double quotes for strings
- Add trailing commas in arrays/objects
- Follow existing code patterns

## 🐛 Reporting Bugs

### Before Submitting

1. Check existing issues
2. Try the latest version
3. Read the troubleshooting guide

### Bug Report Template

**Title:** Brief description

**Environment:**
- OS: macOS/Linux/Windows
- Node.js version: 
- Codex MCP version:
- Codex CLI version:

**Description:**
Clear description of the bug

**Steps to Reproduce:**
1. Spawn agent with...
2. Set reasoning_effort to...
3. Observe...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Logs:**
```
Paste relevant logs here
```

## 💡 Feature Requests

We welcome feature requests! Please:

1. Check if it's already requested
2. Explain the use case
3. Describe the proposed solution
4. Consider implementation complexity

**Template:**
```markdown
### Feature: <Name>

**Problem:**
What problem does this solve?

**Proposed Solution:**
How should it work?

**Alternatives:**
What other approaches were considered?

**Additional Context:**
Screenshots, examples, etc.
```

## 🔒 Security

**DO NOT** open public issues for security vulnerabilities.

Instead, email: timothy.schwarz@qvc.com

See [SECURITY.md](SECURITY.md) for details.

## 📋 Development Checklist

Before submitting a PR:

- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main

## 🌟 Recognition

Contributors will be:
- Listed in release notes
- Credited in commits with Co-Authored-By
- Acknowledged in project documentation

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 💬 Questions?

- Open a GitHub Discussion
- Check existing issues
- Read the documentation

Thank you for contributing! 🎉
