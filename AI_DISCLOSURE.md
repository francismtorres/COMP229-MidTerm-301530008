# AI Usage Disclosure

**Student:** Francis Torres — 301530008
**Course:** COMP229 — Web Application Development, Mid-Term Test
**Project:** Fran's Campus Lost & Found REST API (`COMP229-MidTerm-301530008`)

## Tool used

| | |
|---|---|
| Tool | Claude Code (Anthropic), desktop app |
| Model | Claude Opus 5.5 (`claude-opus-5-5`) |
| When | October 23, 2026, one working session |
| Access given | The project folder on my computer, a terminal, and on-screen control of Postman and MongoDB Compass (each approved by me when requested) |

## What the AI did, mapped to the course's permitted uses

| What the AI did | Permitted use it falls under |
|---|---|
| Read the starter project and the assignment specification, then proposed how to structure the work (validation middleware, controller responsibilities, status-code mapping). | *Help create or revise implementation plans*; *explore possible architectural or implementation approaches* |
| Wrote the Item model validation, `middleware/validateItem.ts`, the seven item controllers, the route wiring and the error-handler additions from the specification. | *Help translate a clearly defined specification into code* |
| Chose a case-insensitive unique index on `title` and owner checks via `item.owner.equals(req.userId)`, and explained why `set()` + `save()` was used instead of `findByIdAndUpdate` (so update validation runs). | *Compare alternative implementations or architectural choices*; *clarify ... APIs, frameworks, or library usage* |
| Designed the test scenarios and edge cases (invalid ids, forged tokens, malformed JSON, duplicate titles in a different case, a second user attempting to modify another user's item). | *Generate possible test cases and edge cases* |
| Wrote the Postman collection with test scripts, and ran it with Newman (44 requests, 56 assertions, 0 failures). | *Help formulate tests for ... APIs, or services* |
| Found and fixed a problem during testing (the malformed-JSON error message was unclear, so the error handler was improved), and re-ran type checking and the provided unit tests. | *Help identify and explain programming errors*; *help interpret error messages and test failures* |
| Reviewed the code for security issues, e.g. rejecting client-supplied `owner` and query-operator injection such as `?type[$ne]=x`. | *Review code for readability, maintainability, security, or possible defects* |
| Wrote the code comments, `IMPLEMENTATION.md`, the README updates and the commit message. | *Assist with documentation and comments* |

## Uses not explicitly on the permitted list

For full transparency, the AI also did the following. The list of permitted
uses does not name these directly:

- **Ran the Postman requests and took the screenshots.** With my approval, the
  AI controlled Postman and MongoDB Compass on my screen, sent each request,
  and captured the 52 screenshots in `screenshots/`. The screenshots are real
  and unedited: every request went to the running API and every Compass view
  shows the actual database.
- **Assembled the test-evidence document**
  (`COMP229-MidTerm-301530008-Test-Screenshots.docx` / `.pdf`), including the
  captions and the results summary table.
- **Handled project logistics:** renaming the folder, starting the local
  MongoDB server, creating the git repository and ZIP archive, and pushing to
  GitHub after I created the empty repository.

## What was not AI-generated

- The starter project (signup/signin, JWT middleware, User model, project
  configuration) was provided by the course.
- The test data is fictional. The two accounts (`fran.torres@...` and
  `alex.other@...`) are test accounts created only for this project.

## My responsibility

I directed the work, approved each action the AI took on my computer, and
reviewed the final code, tests and screenshots. I am responsible for this
submission and can explain how each endpoint works, why each status code is
returned, and how ownership is enforced.
