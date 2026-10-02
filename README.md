# WhistleDrop: Speak Without Being Seen

WhistleDrop is an anonymous reporting platform that allows users to submit concerns without creating an account or providing personal information.

Users receive a private case code that they can use to track their report, receive moderator updates, reply to moderators, and upload additional evidence when requested.

Moderators can review and manage reports without being given the reporter's identity.

## Live Demo

Frontend / Demo:
https://whistledrop-g7r5.onrender.com/

Health Check:
https://whistledrop-g7r5.onrender.com/health

## Repository

https://github.com/TSsanjayy/WhistleDrop

---

## Features

- Anonymous report submission without an account
- No name, email, or user account required
- Cryptographically generated private case codes
- Case-code based report tracking
- Status workflow:
  - SUBMITTED
  - UNDER_REVIEW
  - RESOLVED
  - DISMISSED
- Moderator authentication using a secret key
- Moderator dashboard
- Filter reports by status and category
- Moderator status updates and notes
- Reporter-to-moderator replies
- Additional evidence/attachment requests
- Evidence upload
- Report clearing for resolved and dismissed reports
- Input validation
- Consistent API error responses
- Responsive frontend for desktop and mobile
- REST API testable using Postman, cURL, or other HTTP clients

## Tech Stack

- Node.js
- Express.js
- SQLite
- better-sqlite3
- Multer
- bcrypt
- dotenv
- HTML
- CSS
- JavaScript
- Render

## Frontend

WhistleDrop includes a responsive web interface with:

- Report submission
- Case-code tracking
- Moderator login
- Moderator dashboard
- Status filtering
- Category filtering
- Moderator communication
- Evidence upload
- Mobile-friendly layout

The API can also be used independently through Postman, cURL, or another HTTP client.

---

## Setup

```bash
git clone https://github.com/TSsanjayy/WhistleDrop.git
cd WhistleDrop
npm install
```

Create a `.env` file in the project root:

```env
PORT=3000
MODERATOR_KEY=your-secret-key
```

Run:

```bash
npm start
```

The server runs at `http://localhost:3000`.

`.env` is listed in `.gitignore` and must never be committed. Use a long, random value for `MODERATOR_KEY`.

### Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on (default `3000`) |
| `MODERATOR_KEY` | Secret that grants moderator access |

---

## Report Workflow

A report normally progresses through:

```
SUBMITTED → UNDER_REVIEW → RESOLVED
                         ↘ DISMISSED
```

Status transitions are validated by the backend.

Resolved and dismissed reports can also be managed according to the moderator controls implemented by the application.

**Categories:** `Security`, `Harassment`, `Corruption`, `Technical`, `Other`

### Report Clearing

Resolved and dismissed reports can be cleared from the moderator dashboard.

This action is restricted to reports in the appropriate closed states and is not available for active reports.

---

## API Endpoints

### Public (reporter)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/reports` | Submit an anonymous report; returns a case code |
| GET | `/reports/:caseCode` | Track status, updates, replies and evidence |
| POST | `/reports/:caseCode/evidence` | Upload additional evidence |
| POST | `/reports/:caseCode/reply` | Send a reply to moderators |
| GET | `/health` | Service health check |

### Moderator (requires moderator key)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/moderator/reports` | List reports (filter with `?status=` and `?category=`) |
| GET | `/moderator/reports/:id` | View one report |
| PATCH | `/moderator/reports/:id/status` | Change status and optionally add a status update |
| DELETE | `/moderator/reports/:id` | Clear a resolved or dismissed report |

Moderators authenticate by sending the key in a request header:

```
x-moderator-key: <MODERATOR_KEY>
```

---

## Testing the API

Test with Postman, cURL, or any HTTP client against the live URL or `http://localhost:3000`. Suggested order:

1. `POST /reports` and save the returned `case_code`
2. `GET /reports/:caseCode` to see the `SUBMITTED` status
3. `GET /moderator/reports` with the moderator key
4. `PATCH /moderator/reports/:id/status` to move the report forward
5. `GET /reports/:caseCode` again to see the update
6. Try invalid requests (wrong case code, missing fields, no key) to see the error handling

---

## Example Requests and Responses

### 1. Submit a report

```bash
curl -X POST https://whistledrop-g7r5.onrender.com/reports \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Security",
    "description": "Admin panel is accessible without a password.",
    "evidence_url": "https://example.com/screenshot.png"
  }'
```

`201 Created`

```json
{
  "message": "Report submitted successfully",
  "case_code": "generated-case-code",
  "report_id": 1
}
```

Save the `case_code`. It cannot be recovered.

### 2. Track a report

```bash
curl https://whistledrop-g7r5.onrender.com/reports/<case_code>
```

`200 OK`

```json
{
  "category": "Security",
  "description": "Admin panel is accessible without a password.",
  "status": "UNDER_REVIEW",
  "status_updates": [],
  "replies": [],
  "evidence_upload_enabled": false,
  "evidence_request": null,
  "evidence": []
}
```

### 3. Moderator: list and filter reports

```bash
curl "https://whistledrop-g7r5.onrender.com/moderator/reports?status=SUBMITTED&category=Security" \
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
    "created_at": "2026-10-02T09:49:00Z"
  }
]
```

No reporter information appears anywhere in this response.

### 4. Moderator: update status

```bash
curl -X PATCH https://whistledrop-g7r5.onrender.com/moderator/reports/1/status \
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
| Invalid status change | `400` `{ "error": "Invalid status transition" }` |

---

## Security and Privacy

WhistleDrop is designed around anonymous reporting.

- No user accounts are required.
- No reporter name or email is collected.
- Reports do not store a user ID.
- Reporter IP addresses are not intentionally stored by the application.
- Case codes are generated randomly.
- Case codes are stored as bcrypt hashes.
- Moderator routes require the configured moderator key.
- Uploaded evidence is subject to file validation and size restrictions.
- Reporters should avoid including personally identifying information in report descriptions or uploaded files.
- Case codes should be kept private because possession of a case code provides access to the associated report.

---

## Design Decisions and Assumptions

- **Case code instead of accounts.** It gives reporters ongoing access without any identity, which is the core requirement.
- **Hashed case codes.** Only hashes are stored, so a database leak does not expose working codes.
- **Shared moderator key.** A single secret protects moderator routes. This keeps the project simple; a production system would use per-moderator accounts with roles and audit logs.
- **Server-side validation.** Categories, statuses and required fields are validated by the backend, not just the frontend.
- **SQLite for storage.** Chosen for zero-setup development. A hosted database would be used in production.
- **Moderator replies are visible to reporters** through the case code, since it is the only communication channel.
- **Assumption:** a lost case code cannot be recovered. Recovery would require identity, which defeats the purpose.
- **Assumption:** uploaded files may contain identifying metadata, so reporters are advised to remove it before uploading.

---

## Deployment

The application is deployed on Render's free web service.

The free instance can spin down after inactivity, which may cause a cold start when the application is accessed again.

The application currently uses SQLite and local file storage. Because the free Render instance does not provide persistent storage for this setup, database data and uploaded files should not be treated as permanent production storage.

---

## Project Structure

```
whistledrop/
├── public/
│   └── index.html
├── src/
│   ├── controllers/
│   │   ├── reportController.js
│   │   └── moderatorController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── upload.js
│   ├── models/
│   │   └── reportModel.js
│   └── routes/
│       ├── reports.js
│       └── moderator.js
├── database.js
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

---

## License

Built for educational and demonstration purposes.