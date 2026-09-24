# WhistleDrop Backend

Anonymous whistleblowing/reporting backend built with Node.js, Express and SQLite.

## Tech Stack

- Node.js
- Express.js
- SQLite
- better-sqlite3
- bcrypt
- dotenv
- Nodemon

## Features

- Anonymous report submission
- Random case-code generation
- Case codes are hashed with bcrypt before storage
- Reporter can track a report using the case code
- Moderator authentication using a secret key
- Moderator report listing
- Filter reports by status or category
- Controlled report status transitions
- Moderator status notes
- Consistent JSON error responses
- No reporter identity fields are stored

## Project Structure

```text
whistledrop-backend/
├── src/
│   ├── controllers/
│   │   └── reportController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   └── reportModel.js
│   ├── routes/
│   │   ├── moderator.js
│   │   └── reports.js
│   ├── database.js
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── package-lock.json
```

Setup
Install dependencies:

```
npm install
```

Create a `.env` file:

```
PORT=3000
MODERATOR_KEY=your-secret-key
```

Start the development server:

```
npm run dev
```

The server runs on:

```
http://localhost:3000
```

API Endpoints
Health Check

```
GET /health
```

Response:

```
{
  "status": "ok"
}
```

Submit Report

```
POST /reports
```

Request:

```
{
  "category": "Security",
  "description": "Example report",
  "evidence_url": "https://example.com/evidence"
}
```

Response:

```
{
  "message": "Report submitted successfully",
  "case_code": "generated-case-code",
  "report_id": 1
}
```

The case code is returned to the reporter and is not stored in raw form.
Allowed categories:

*  Security 
*  Harassment 
*  Fraud 
*  Other 

Track Report

```
GET /reports/:caseCode
```

Response:

```
{
  "status": "SUBMITTED",
  "status_updates": []
}
```

A valid case code returns the report status and status updates.
An invalid case code returns:

```
{
  "error": "Not found"
}
```

Moderator Report List

```
GET /moderator/reports
```

Required header:

```
x-moderator-key: your-secret-key
```

Optional filters:

```
/moderator/reports?status=RESOLVED
/moderator/reports?category=Security
```

Update Report Status

```
PATCH /moderator/reports/:id/status
```

Required header:

```
x-moderator-key: your-secret-key
```

Request:

```
{
  "status": "UNDER_REVIEW",
  "note": "Report is being reviewed"
}
```

Allowed status flow:

```
SUBMITTED
     ↓
UNDER_REVIEW
    ↙ ↘
RESOLVED  DISMISSED
```

Invalid status transitions return HTTP `409`.
Database
reports
Stores submitted reports.
Important fields:

* `id` 
* `case_code_hash` 
* `category` 
* `description` 
* `evidence_url` 
* `status` 
* `created_at` 

status_updates
Stores status changes and moderator notes.
Important fields:

* `id` 
* `report_id` 
* `message` 
* `status` 
* `created_at` 

Anonymity
WhistleDrop does not store reporter identity information such as:

*  Name 
*  Email 
*  Phone number 
*  User ID 
*  Session ID 
*  IP address 

The reporter receives a random case code.
Only the bcrypt hash of that case code is stored in the database.
The raw case code is returned when the report is submitted and should be saved by the reporter.
Testing
The backend was tested for:

*  Successful report submission 
*  Invalid categories 
*  Missing required fields 
*  Case-code tracking 
*  Invalid case codes 
*  Moderator authentication 
*  Invalid moderator keys 
*  Status updates 
*  Invalid status transitions 
*  Status filtering 
*  Category filtering