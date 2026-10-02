# WhistleDrop

### Anonymous Reporting & Case Tracking Platform

WhistleDrop is an anonymous reporting platform that allows users to securely submit concerns, track their reports using a private case code, and communicate with moderators without creating an account.

## Features

- 🕵️ **Anonymous reporting** — Submit reports without creating an account.
- 🔐 **Private case codes** — Each report receives a unique case code for tracking.
- 📋 **Report tracking** — Check the current status of a submitted report.
- 💬 **Moderator communication** — Moderators can send updates and respond to reporters.
- 📎 **Evidence attachments** — Reports can include supporting attachments.
- 📤 **Additional evidence requests** — Moderators can request additional attachments from reporters.
- 🛡️ **Moderator dashboard** — Review, filter, and manage submitted reports.
- 📱 **Responsive interface** — Designed for both desktop and mobile devices.
- 🔒 **No reporter identity stored** — Reports are not associated with a user account.

## Report Lifecycle

A report can move through the following states:

```text
Submitted
    ↓
Under Review
    ↓
Resolved / Dismissed
```

Moderators can communicate with reporters during the review process and request additional attachments when necessary.

## Tech Stack

### Backend

- Node.js
- Express.js
- SQLite
- better-sqlite3
- bcrypt
- Multer
- dotenv

### Frontend

- HTML
- CSS
- JavaScript

### Deployment

- Render
- GitHub

## Project Structure

```text
whistledrop-backend/
│
├── public/
│   └── index.html
│
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── routes/
│
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

## How It Works

### 1. Submit a Report

The reporter selects a category, provides a description, and can optionally attach supporting evidence.

The server generates a unique case code for the report.

The case code is stored securely using a hash rather than storing the original code directly.

### 2. Track a Report

The reporter keeps their case code and uses it to retrieve their report later.

The server verifies the supplied case code against the stored hash and returns the report's current status and relevant communication.

### 3. Moderator Review

Authorized moderators can access the moderator dashboard to:

- View reports
- Filter reports by status and category
- Review report details
- Update report status
- Send notes/replies
- Request additional attachments
- Review submitted evidence

### 4. Resolution

Reports can eventually be marked as:

- **Resolved**
- **Dismissed**

The reporter can see the updated status when they use their case code.

## API

### Reports

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/reports` | Submit a new report |
| `GET` | `/reports/:caseCode` | Track a report |
| `POST` | `/reports/:caseCode/evidence` | Upload additional evidence |
| `POST` | `/reports/:caseCode/reply` | Send a reporter reply |

### Moderator

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/moderator/reports` | Retrieve reports |
| `PATCH` | `/moderator/reports/:id/status` | Update report status |

### Health Check

```http
GET /health
```

Returns:

```json
{
  "status": "ok"
}
```

## Running Locally

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd whistledrop-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file:

```env
PORT=3000
MODERATOR_KEY=your-moderator-key
```

Never commit `.env` to GitHub.

### 4. Start the server

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

The application will be available at:

```text
http://localhost:3000
```

## Security & Privacy

WhistleDrop is designed around anonymous reporting.

- No reporter account is required.
- Reports are not linked to a user ID.
- Case codes are hashed before being stored.
- Moderator access requires authentication.
- Environment secrets are kept outside the repository.
- Evidence uploads are handled separately from report metadata.

> Users should keep their case code private because it is required to access their report.

## Deployment

The application can be deployed as a Node.js web service on Render.

Typical deployment configuration:

```text
Build Command:
npm install

Start Command:
npm start
```

Environment variables such as `MODERATOR_KEY` should be configured through the hosting provider rather than committed to the repository.

## Status

🚀 **Deployed and actively developed**

---

## License

This project is currently intended for educational and demonstration purposes.