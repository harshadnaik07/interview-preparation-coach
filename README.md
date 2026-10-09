# Prepwise — Interview Coach

Prepwise is an interview-practice app with a browser UI and a small Node backend.

## What is implemented

- `POST /api/questions` returns five questions for a built-in domain or a custom domain.
- The server keeps the question bank in `data/question-bank.json`.
- If `OPENAI_API_KEY` is configured, the Responses API generates five custom questions and evaluates transcript answers with structured JSON.
- If the key is missing or the AI request fails, the app falls back to the local question bank and heuristic evaluator.
- The browser never receives or stores the API key.
- Voice recording stays active until the user presses the stop button.

## Run locally

Requires Node.js 18 or newer.

```powershell
npm start
```

Open <http://localhost:3000>.

To enable AI generation and evaluation, edit the local `.env` file:

```powershell
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5-mini
PORT=3000
```

Then start the app:

```powershell
npm start
```

Never put `OPENAI_API_KEY` in `index.html`, `js/`, local storage, or any value exposed to the browser. Use `.env` tooling or your deployment platform's server-side secret manager in production.

## API routes

### `POST /api/questions`

Request:

```json
{"domain":"cybersecurity","level":"Early career","type":"custom"}
```

Response:

```json
{"source":"ai","questions":[{"question":"...","keywords":["..."]}]}
```

### `POST /api/evaluate`

Request:

```json
{"domain":"cybersecurity","question":"...","keywords":["debug"],"answer":"..."}
```

The AI response contains `score`, `relevance`, `structure`, `detail`, `feedback`, `strengths`, and `improvements`.
