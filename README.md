# WhistleDrop: Speak Without Being Seen

An anonymous reporting backend. Anyone can submit a report without an account, track it with a private case code, and communicate with moderators, who can manage reports but can never see who sent them.

**Live demo:** https://YOUR-APP.onrender.com

**Health check:** https://YOUR-APP.onrender.com/health

> Hosted on Render's free tier. The service sleeps after ~15 minutes of inactivity, so the first request may take 30-60 seconds. Data and uploads may reset on restart or redeploy.

---

## Features

- Anonymous report submission (no account, no email, no name)
- Hard-to-guess case code for tracking
- Status workflow: `SUBMITTED → UNDER_REVIEW → RESOLVED / DISMISSED`
- Moderator access protected by a secret key
- Filter reports by status and category
- Moderator status updates, notes and replies
- Evidence upload and attachment requests
- Input validation and consistent error responses
- Fully testable with Postman or cURL; no frontend required

## Tech Stack

Node.js, Express, SQLite (`better-sqlite3`), Multer (uploads), dotenv. Deployed on Render.

---

## Setup

```bash
git clone <repository-url>
cd whistledrop-backend
npm install
```

Create a `.env` file in the project root:

```env
PORT=3000
MODERATOR_KEY=im7
```

Run:

```bash
npm start
```

The server runs at `http://localhost:3000`. Never commit `.env`.

### Environment variables

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on (default `3000`) |
| `MODERATOR_KEY` | Secret that grants moderator access |

---

## Report Workflow

```
SUBMITTED → UNDER_REVIEW → RESOLVED
                         ↘ DISMISSED
```

Only valid forward transitions are accepted. Skipping a step or changing a closed report returns `400`.

**Categories:** `Security`, `Harassment`, `Corruption`, `Technical`, `Other`

---

## API Endpoints

### Public (reporter)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/reports` | Submit an anonymous report; returns a case code |
| GET | `/reports/:caseCode` | Track status, updates and moderator replies |
| POST | `/reports/:caseCode/evidence` | Upload additional evidence |
| POST | `/reports/:caseCode/reply` | Send a reply to moderators |
| GET | `/health` | Service health check |

### Moderator (requires moderator key)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/moderator/reports` | List reports (filter with `?status=` and `?category=`) |
| GET | `/moderator/reports/:id` | View one report |
| PATCH | `/moderator/reports/:id/status` | Change status and optionally add a status update |

Moderators authenticate by sending the key in a request header:

```
x-moderator-key: <MODERATOR_KEY>
```

---

## Testing the API

This is a backend-only project. Test it with Postman, cURL, or any HTTP client against the live URL or `http://localhost:3000`. Suggested order:

1. `POST /reports` and save the returned `caseCode`
2. `GET /reports/:caseCode` to see the `SUBMITTED` status
3. `GET /moderator/reports` with the moderator key
4. `PATCH /moderator/reports/:id/status` to move the report forward
5. `GET /reports/:caseCode` again to see the update
6. Try invalid requests (wrong case code, missing fields, no key) to see the error handling

## Example Requests and Responses

### 1. Submit a report

```bash
curl -X POST http://localhost:3000/reports \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Security",
    "description": "Admin panel is accessible without a password.",
    "evidenceUrl": "https://example.com/screenshot.png"
  }'
```

`201 Created`

```json
{
  "message": "Report submitted. Save your case code; it cannot be recovered.",
  "caseCode": "WD-7K2M-Q9XA-4TPE",
  "status": "SUBMITTED"
}
```

### 2. Track a report

```bash
curl http://localhost:3000/reports/WD-7K2M-Q9XA-4TPE
```

`200 OK`

```json
{
  "category": "Security",
  "status": "UNDER_REVIEW",
  "updates": [
    { "message": "We are looking into this.", "createdAt": "2026-10-02T10:15:00Z" }
  ]
}
```

### 3. Moderator: list and filter reports

```bash
curl "http://localhost:3000/moderator/reports?status=SUBMITTED&category=Security" \
  -H "x-moderator-key: YOUR_KEY"
```

`200 OK`

```json
[
  {
    "id": 1,
    "category": "Security",
    "description": "Admin panel is accessible without a password.",
    "status": "SUBMITTED",
    "createdAt": "2026-10-02T09:49:00Z"
  }
]
```

Note: no reporter information appears anywhere in this response.

### 4. Moderator: update status

```bash
curl -X PATCH http://localhost:3000/moderator/reports/1/status \
  -H "x-moderator-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "status": "UNDER_REVIEW", "update": "We are looking into this." }'
```

`200 OK`

```json
{ "id": 1, "status": "UNDER_REVIEW" }
```

### 5. Error examples

| Request | Response |
|---|---|
| Missing `description` on submit | `400` `{ "error": "description is required" }` |
| Unknown category | `400` `{ "error": "Invalid category" }` |
| Unknown case code | `404` `{ "error": "Report not found" }` |
| Moderator route without key | `401` `{ "error": "Unauthorized" }` |
| Moderator route with wrong key | `403` `{ "error": "Forbidden" }` |
| Invalid status change (e.g. `SUBMITTED → RESOLVED`) | `400` `{ "error": "Invalid status transition" }` |

---

## How Anonymity Is Maintained

- **No identity is collected.** There are no accounts, and the report form has no name or email fields.
- **No reporter identifiers are stored.** Reports contain only category, description, optional evidence, status and timestamps. IP addresses and user agents are not saved with reports.
- **Moderators and the API never receive reporter data.** Response shapes contain no identity fields because none exist in the database.
- **Case codes are random, not derived from anything.** They are generated with a cryptographically secure random generator, have enough entropy to resist guessing, and are not sequential.
- **Case codes are stored hashed**, so a database leak does not expose working codes.
- **The case code is the only link back to a report.** It is shown once; whoever holds it can track the report, so the reporter must keep it private.

---

## Design Decisions and Assumptions

- **Case code instead of accounts.** It gives reporters ongoing access without any identity, which is the core requirement.
- **Shared moderator key.** A single secret key protects moderator routes. This keeps the system simple for the scope of the project; a production system would use per-moderator accounts with roles and audit logs.
- **Strict status workflow.** Transitions are validated server-side so a report cannot skip review or be reopened after closing.
- **SQLite for storage.** Chosen for zero-setup local development. On Render's free tier the disk is ephemeral, so data resets on restart; a hosted database would be used in production.
- **Moderator replies are visible to reporters** through the case code, since this is the only communication channel.
- **Assumption:** reporters can lose their case code, and it cannot be recovered. Recovery would require identity, which defeats the purpose.
- **Assumption:** evidence files may contain identifying metadata. Reporters are advised to strip metadata before uploading, and uploads are restricted by type and size.

---

## Limitations

- Free-tier hosting: cold starts and non-persistent data and uploads.
- A shared moderator key is not suitable for large teams.
- Anonymity depends on the reporter's own behavior (network, file metadata, writing style).

---

## Project Structure

```
whistledrop-backend/
├── public/            # optional demo page (not required to use the API)
├── src/
│   ├── controllers/   # report and moderator logic
│   ├── middleware/    # auth, error handler, uploads
│   ├── models/        # database models
│   └── routes/        # reports and moderator routes
├── database.js
├── server.js
├── package.json
└── README.md
```

---

## License

Built for educational and demonstration purposes.
