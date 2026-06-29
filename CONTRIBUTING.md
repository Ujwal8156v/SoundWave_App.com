# Contributing to SoundWave

Thank you for your interest in contributing to SoundWave! This document provides guidelines for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Provide a clear title and description
3. Include steps to reproduce
4. Specify your environment

### Suggesting Features

1. Check if the feature has been suggested
2. Provide a clear use case
3. Explain the expected behavior

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run development
npm run dev
```

## Code Standards

- Use ES6+ features
- Follow ESLint rules
- Write meaningful commit messages
- Add tests for new features
- Update documentation

## Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `test/description` - Tests

## Commit Messages

```
<type>: <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, test, chore

## Pull Request Template

```markdown
## Description
Brief description of changes

## Related Issues
Closes #123

## Testing
How to test these changes

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added
- [ ] Documentation updated
- [ ] Tests added/updated
```

## Questions?

Open an issue or discussion for questions.
