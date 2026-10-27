# Test an MCP server with QAmcp

You are a coding agent. The user wants you to test their MCP server with QAmcp, explain what is wrong in plain words, and fix it. QAmcp is a free, open-source MCP server tester (MIT). It runs on the user's computer, sends nothing anywhere except to the server being tested, and has no tracking.

Follow these steps in order. Keep the user informed in short, plain sentences.

## 1. Find the server

Work out how the user's MCP server is reached, using the project files before asking:

- A server that runs as a program on this computer (stdio): look for its start command in `package.json` scripts, `pyproject.toml`, a `Makefile`, the README, or an MCP client config (`.cursor/mcp.json`, `.vscode/mcp.json`, `claude_desktop_config.json`, `.mcp.json`).
- A server on the internet or a local port: look for its URL (often ending in `/mcp`) in the README, deploy config or `.env.example`.

If you find more than one, or none, ask the user which server to test. Never guess a production URL.

## 2. Run the test

You need Node.js 20 or newer. Then run one of these:

```bash
npx -y qamcp-cli --stdio "<start command>"          # a server started from this project
npx -y qamcp-cli https://your-server.example/mcp    # a server reachable by URL
```

Useful options:

- Needs an API key: `--header "Authorization: Bearer <key>"`. Read the key from the environment or ask the user; never print it or write it into files.
- Needs a sign-in: `--login` (opens the login page in the user's browser).
- Needs environment variables (stdio): `--env NAME=value`, repeatable.
- Save a shareable report: `--html qamcp-report.html`. Machine-readable: `--json qamcp-report.json`.
- The user owns the server and wants more tools exercised: `--owner`. Only on a test copy, never on live data: `--run-unlabeled`.

By default QAmcp only runs tools the server labels read-only and never runs tools that sound destructive. Keep it that way unless the user asks.

## 3. Explain the result

Tell the user the score (0 to 100) and the coverage line ("Tested N of N checks · ran X of Y tools"), then the problems in plain words, most serious first:

1. Anything that caps the score: hidden instructions in a description, a leaked secret in an error message, a broken tool definition, a tool that crashes or hangs.
2. Other failures (✕).
3. Warnings (⚠).
4. Tips under "Follows MCP best practices" (not scored).

If the report says tools were "Not run" because they have no safety label, say so: once the labels are fixed (step 4), the next run can test those tools and may find new problems, like a secret leaking from an error message. That is expected.

Quote QAmcp's own finding text for each problem. Don't invent problems QAmcp didn't report, and don't call a tip a failure.

## 4. Fix, with the user's agreement

Propose the fixes before making them, grouped by file. Typical fixes:

- Missing or vague tool descriptions, or inputs without a description: write clear ones that say what the tool does and returns.
- Missing safety labels: add `readOnlyHint`, `destructiveHint`, `idempotentHint` and `openWorldHint` annotations that tell the truth about each tool. Never mark a tool read-only if it writes, sends or deletes anything.
- Bad inputs accepted silently: validate required inputs and types, and return a clear tool error.
- Errors showing secrets, file paths or stack traces: return a short message instead, and log details on the server side. If a real secret was exposed, tell the user to rotate it.
- A local server printing logs to stdout: send logs to stderr.
- Hidden instructions in a description: remove them, and tell the user plainly; if they didn't write them, treat it as a security incident.

Change only what the findings point to. Don't refactor unrelated code.

## 5. Test again

Run the same command again and show the score before and after, plus any finding still open and why.

## 6. Offer to keep it tested

Offer these, and set up only what the user says yes to:

- Test before every commit: `npx -y qamcp-cli --install-hook --stdio "<start command>"` (or `--install-hook <url>`). Skip once with `git commit --no-verify`.
- Test on every pull request (GitHub Actions), in `.github/workflows/qamcp.yml`:

```yaml
name: QAmcp
on: [pull_request]
permissions:
  contents: read
  pull-requests: write
jobs:
  qamcp:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: QAmcp/qamcp-cli@v0
        with:
          url: https://your-server.example/mcp
          fail-under: 80
```

- A server people already depend on: QAmcp Monitor (https://qamcp.dev) checks it every 5 minutes and emails the owner when it goes down, the score drops, a tool changes, or a secret leaks.

## Reference

- Every command and option: https://qamcp.dev/cli.html
- How the score works: https://qamcp.dev/how-it-works.html
- Source and issues: https://github.com/QAmcp/qamcp-cli
