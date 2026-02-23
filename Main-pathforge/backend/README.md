# PathForge Backend

Express + MongoDB backend for PathForge.

## Prerequisites

- Node.js 18+
- npm
- MongoDB (local or Atlas)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create/update `.env` values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/pathforge
JWT_SECRET=replace-with-a-long-random-secret
GOOGLE_CLIENT_ID=replace-with-google-oauth-web-client-id.apps.googleusercontent.com
SMTP_SERVICE=gmail
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=PathForge <your-email@gmail.com>
OTP_EXP_MINUTES=10
OTP_RESEND_SECONDS=60
OTP_MAX_ATTEMPTS=5
```

If you use MongoDB Atlas, `MONGO_URI` should look like:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/pathforge?retryWrites=true&w=majority
```

## Run

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

## API Base

`http://localhost:5000/api`

## Signup Email Verification

- Request OTP: `POST /api/auth/register/request-otp`
- Verify OTP and create account: `POST /api/auth/register/verify-otp`

## Notes

- Server startup now waits for MongoDB connection.
- If `MONGO_URI` is missing or invalid, the server exits with a clear error.
