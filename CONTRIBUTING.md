# Contributing to Shopify AI Agent

Thank you for taking the time to contribute! 🎉

## Branching Strategy

- `main` — stable, protected. Never push directly.
- `dev` — integration branch
- `feature/your-feature` — branch off `dev` for new features
- `fix/your-bug` — branch off `dev` for bug fixes

## Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(chat): add Tamil language support
fix(tools): handle Shopify API timeout with retry
docs(readme): update architecture diagram
test(policies): add unit tests for all 5 policy topics
ci(actions): add mypy type checking step
refactor(agent): extract tool router into separate module
chore(deps): update google-generativeai to 0.9.0
```

## Pull Request Process

1. Branch off `dev`: `git checkout -b feature/your-feature dev`
2. Make small, focused commits
3. Open a PR against `dev` (not `main`)
4. Fill in the PR template (what/why/screenshots)
5. CI must pass before merge

## Setup for Development

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp ../.env.example .env  # then fill in your keys

# Run backend
uvicorn app.main:app --reload

# Widget
cd widget
npm install
npm run dev
```

## Security

- **Never commit `.env` or any real API keys.**
- Run `git status` before every commit.
- If you accidentally commit a secret, rotate it immediately.
