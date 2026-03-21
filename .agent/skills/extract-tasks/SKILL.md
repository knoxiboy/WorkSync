---
description: Extracts tasks from a meeting transcript by calling the internal API.
---

# Extract Tasks Skill

This skill allows the agent to process meeting transcripts and automatically generate task objects in the WorkSyncAI database.

## Usage

1. Capture or paste a meeting transcript.
2. Call `POST /api/meeting/extract` with the transcript.
3. The AI will return a list of tasks which are then matched to company users.

## Prompt Pattern

"Extract developer tasks from this transcript: {{transcript}}"
