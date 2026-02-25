# AGENTS.md

## Purpose
Guidance for contributors (human and AI) writing Python in this repository.

## Scope
- Applies to all Python code in this repo.

## Minimum Standards
- Use clear, descriptive names.
- Add type hints for all function variables and outputs.
- Use Google-style docstrings.
- All functions should have docstrings.
- Prefer simple, explicit code over clever abstractions.
- Keep functions focused and reasonably small.
- Avoid hardcoded secrets and config - set in .env or config.py
- Ensure to update README content along with code (if needed)

## Git safety
- NEVER run `git commit`, `git push`, `git merge`, `git rebase`, or `git tag`.
- NEVER stage changes (`git add`) unless explicitly asked in that message.
- Always stop after edits and provide suggested git commands for the user to run manually.
