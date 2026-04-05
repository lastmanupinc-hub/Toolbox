# Brand Guidelines — avery-pay-platform

> Brand identity and communication standards for avery-pay-platform

## Brand Identity

**Product Name:** avery-pay-platform
**Category:** static site
**Primary Technology:** Go
**Description:** PAI'D is **two systems in one repo**:

## Positioning

avery-pay-platform is a static site built with Go.

**Target Audience:** Technical users and developers.

## Voice Attributes

| Attribute | Description | Do | Don't |
|-----------|-------------|-----|-------|
| Clear | Say exactly what you mean | Use plain language | Use jargon without context |
| Confident | State facts directly | "This does X" | "This might help with X" |
| Helpful | Anticipate the next question | Provide examples | Leave the user guessing |
| Technical | Respect the audience's skill | Use correct terminology | Over-simplify for experts |
| Concise | Respect the reader's time | Get to the point | Add filler paragraphs |

## Communication Standards

### Documentation

- Lead with what the user can do, not how the code works internally
- Every page should have a clear "what", "why", and "how" structure
- Code examples must be copy-paste ready and tested
- Use imperative mood for instructions: "Run the command" not "You should run the command"

### Error Messages

- State what happened, why, and what the user can do about it
- Include the specific value that caused the error when safe to do so
- Never show raw stack traces to end users
- Format: `[What went wrong]. [Why]. [What to do next].`

### UI Copy

- Button labels: use verbs ("Save", "Export", "Generate") not nouns
- Empty states: explain what will appear and how to get there
- Loading states: describe what's happening ("Analyzing repository...")
- Success states: confirm what happened ("3 files generated")

### API Responses

- Error responses include `error` (human-readable) and machine-parseable status codes
- Success responses include the created/modified resource
- Use consistent field naming (snake_case)
- Include `timestamp` in all responses for debugging

## Stack-Specific Application

This project uses: Svelte


## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Product name | Capitalized | avery-pay-platform |
| Feature names | Sentence case | "Context analysis" |
| CLI commands | kebab-case | `generate-report` |
| API endpoints | kebab-case | `/v1/search/export` |
| Config keys | snake_case | `max_file_size` |
| Environment vars | SCREAMING_SNAKE | `AXIS_DB_PATH` |
