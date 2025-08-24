# Contributing to Canairy

Thank you for your interest in contributing to Canairy! We believe that early warning systems should be accessible to all families, and your contributions help make that possible.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, browser, version)
- **Error messages** and console logs

### Suggesting Features

We welcome feature suggestions! Please provide:

- **Use case**: Who benefits and how?
- **Expected behavior**: How should it work?
- **Mockups/examples**: Visual aids help!
- **Priority rationale**: Why is this important?

### Code Contributions

1. **Find an issue**: Look for issues labeled `good first issue` or `help wanted`
2. **Comment**: Let us know you're working on it
3. **Fork & Branch**: Create a feature branch
4. **Code**: Follow our standards
5. **Test**: Add/update tests
6. **Document**: Update relevant docs
7. **Submit PR**: Follow the template

### Data Source Contributions

Adding new indicators or data sources:

1. **Research**: Ensure data is reliable and accessible
2. **Implement Collector**: Follow the collector template
3. **Add Tests**: Include mock data for testing
4. **Document**: Update data sources documentation
5. **Consider Fallbacks**: What if the primary source fails?

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Git
- Docker (optional, for full stack)

### Local Development

1. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/canairy.git
   cd canairy
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   pip install -r requirements.txt
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Add your API keys for testing
   ```

4. **Run development servers**
   ```bash
   # Terminal 1: Frontend
   npm run dev
   
   # Terminal 2: Backend
   cd backend
   uvicorn main:app --reload
   ```

5. **Run tests**
   ```bash
   # Frontend tests
   npm test
   
   # Backend tests
   cd backend
   pytest
   ```

### Docker Development

```bash
# Run full stack
docker-compose up

# Run with hot reload
docker-compose -f docker-compose.dev.yml up
```

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log or debug code
- [ ] Branch is up to date with main

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots]

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
```

### Review Process

1. **Automated checks** run on all PRs
2. **Code review** by at least one maintainer
3. **Testing** in staging environment
4. **Merge** when approved and tests pass

## Coding Standards

### TypeScript/JavaScript

```typescript
// Good: Clear, typed, documented
interface IndicatorData {
  id: string;
  value: number;
  status: 'green' | 'amber' | 'red';
}

/**
 * Calculate the HOPI score based on indicator states
 * @param indicators - Array of current indicator data
 * @returns HOPI score between 0-100
 */
export function calculateHOPI(indicators: IndicatorData[]): number {
  // Implementation
}

// Bad: Unclear, untyped, undocumented
function calc(data) {
  // Mystery implementation
}
```

### Python

```python
# Good: Type hints, docstrings, clear naming
from typing import List, Dict, Optional
from datetime import datetime

def fetch_indicator_data(
    indicator_id: str,
    start_date: Optional[datetime] = None
) -> Dict[str, float]:
    """
    Fetch indicator data from primary source.
    
    Args:
        indicator_id: Unique indicator identifier
        start_date: Optional start date for historical data
        
    Returns:
        Dictionary of timestamp: value pairs
        
    Raises:
        DataSourceError: If source is unavailable
    """
    # Implementation

# Bad: No types, no docs, unclear
def get_data(id, date=None):
    # Implementation
```

### React Components

```tsx
// Good: Typed props, memoization, clear structure
interface IndicatorCardProps {
  indicator: IndicatorData;
  onSelect?: (id: string) => void;
}

export const IndicatorCard: React.FC<IndicatorCardProps> = React.memo(({
  indicator,
  onSelect
}) => {
  // Component implementation
});

// Bad: Untyped, not memoized
export function Card(props) {
  // Component implementation
}
```

### CSS/Styling

- Use Tailwind utilities first
- Custom CSS only when necessary
- Follow dark theme color palette
- Ensure responsive design

## Testing Guidelines

### Unit Tests

```typescript
// Frontend test example
describe('calculateHOPI', () => {
  it('should return 0 for all green indicators', () => {
    const indicators = [
      { id: '1', value: 1, status: 'green' },
      { id: '2', value: 1, status: 'green' }
    ];
    
    expect(calculateHOPI(indicators)).toBe(0);
  });
  
  it('should weight critical indicators higher', () => {
    // Test implementation
  });
});
```

```python
# Backend test example
def test_treasury_collector():
    """Test treasury tail risk data collection."""
    collector = TreasuryTailCollector()
    
    # Mock the API response
    with patch('requests.get') as mock_get:
        mock_get.return_value.json.return_value = {
            'value': 2.3
        }
        
        result = collector.collect()
        assert result.value == 2.3
        assert result.status == 'amber'
```

### Integration Tests

Test complete workflows:
- User viewing dashboard
- Alert generation and delivery
- Data collection pipeline
- API endpoint responses

### Performance Tests

- Dashboard load time < 3s
- API response time < 200ms
- Memory usage stable over time

## Documentation

### Code Documentation

- **Functions**: Document parameters, returns, exceptions
- **Complex logic**: Add inline comments
- **Components**: Document props and usage
- **APIs**: Include example requests/responses

### User Documentation

When adding features:
1. Update user manual
2. Add to FAQ if needed
3. Include screenshots
4. Update video tutorials list

### Technical Documentation

For architectural changes:
1. Update architecture diagram
2. Document design decisions
3. Update API documentation
4. Add to changelog

## Community

### Getting Help

- **Discord**: https://discord.gg/canairy
- **GitHub Discussions**: For questions and ideas
- **Stack Overflow**: Tag with `canairy`

### Communication

- Be respectful and inclusive
- Provide context in discussions
- Share knowledge and help others
- Celebrate contributions!

### Recognition

Contributors are recognized in:
- Release notes
- Contributors page
- Annual community report

## Specific Contribution Areas

### Frontend (React/TypeScript)

Focus areas:
- Performance optimization
- Mobile responsiveness
- Accessibility (WCAG 2.1)
- New visualization types
- PWA enhancements

### Backend (Python/Node.js)

Focus areas:
- New data collectors
- API performance
- Caching strategies
- Database optimization
- Security hardening

### Data Science

Focus areas:
- Indicator correlation analysis
- Predictive modeling
- Anomaly detection
- Pattern matching algorithms

### DevOps/Infrastructure

Focus areas:
- CI/CD improvements
- Monitoring/alerting
- Deployment automation
- Cost optimization
- Security scanning

### Documentation

Focus areas:
- Translations
- Video tutorials
- Use case examples
- API client libraries
- Integration guides

## Release Process

We follow semantic versioning:

- **Patch** (x.x.1): Bug fixes
- **Minor** (x.1.x): New features, backward compatible
- **Major** (1.x.x): Breaking changes

Releases happen:
- Patches: As needed
- Minor: Monthly
- Major: Quarterly

## Legal

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Canairy! Together, we're building a more prepared and resilient world. 🐦

*Questions? Reach out to contribute@canairy.app*