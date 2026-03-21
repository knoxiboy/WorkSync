---
description: Evaluates a GitHub PR against a specific task description.
---

# Evaluate PR Skill

This skill enables the agent to fetch code from a GitHub Pull Request and evaluate its correctness relative to a Task.

## Usage

1. Identify the `taskId`, `owner/repo`, and `prNumber`.
2. Call `POST /api/evaluate`.
3. The skill provides a scoring breakdown and issues/suggestions.

## Prompt Pattern

"Evaluate PR #{{prNumber}} in {{repo}} for task {{taskId}}"
