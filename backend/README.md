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

2. Create environment file:

```bash
cp .env.example .env
```

3. Update `.env` values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/pathforge
JWT_SECRET=replace-with-a-long-random-secret
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

## Notes

- Server startup now waits for MongoDB connection.
- If `MONGO_URI` is missing or invalid, the server exits with a clear error.
