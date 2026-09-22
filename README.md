# Natours API

A REST API for a tour-booking service — Node.js, Express and MongoDB.

Covers the parts of an API that are easy to skip and expensive to retrofit: authentication,
role-based authorisation, a reusable query layer, and error handling that doesn't leak
internals in production.

## Stack

Node.js · Express 4 · MongoDB · Mongoose · JWT · bcrypt · Sharp · Nodemailer

## What it does

**Authentication & authorisation**
- Signup, login and logout with a JWT issued as an httpOnly cookie
- Passwords hashed with bcrypt; reset flow over email using expiring, hashed tokens
- Four roles — `user`, `guide`, `lead-guide`, `admin` — enforced per route via `restrictTo`
- Tokens issued before a password change are rejected afterwards

**Tours** — full CRUD with role-gated writes, aggregation pipelines for statistics and a
monthly booking plan, and image upload processed with Sharp.

**Reviews** — nested under tours, with a compound index enforcing one review per user per tour.

**Reusable query layer** (`utils/apiFeatures.js`) — filtering, sorting, field limiting and
pagination driven entirely by the query string:

```
GET /api/v1/tours?difficulty=easy&price[lt]=1000&sort=-ratingsAverage&fields=name,price&page=2&limit=10
```

**Error handling** — an `AppError` class plus a `catchAsync` wrapper, so no route handler
needs its own try/catch. Operational errors return a clean message; unexpected ones return
a generic response in production and the full stack in development.

**Security middleware** — `helmet` headers, rate limiting, NoSQL-injection sanitisation
(`express-mongo-sanitize`), XSS cleaning, and HTTP parameter pollution protection (`hpp`).

## Running locally

```bash
npm install
cp config.env.example config.env    # fill in your own values
npm start
```

Seed the database:

```bash
node import-dev-data.js --import
```

## Structure

```
controllers/   auth, tours, users, reviews, error handling
models/        Mongoose schemas with validation and middleware
routes/        Express routers
utils/         apiFeatures, AppError, catchAsync, sendEmail
dev-data/      seed JSON
```

## Notes

- Built while working through Jonas Schmedtmann's Node.js course, then extended.
- This repository contains the API only. The course's bundled front-end assets are not
  included, so the Pug view layer configured in `app.js` has no templates here — the
  `/api/v1` routes are what this repo is for.
- `config.env` is gitignored. Copy `config.env.example` and supply your own credentials.
