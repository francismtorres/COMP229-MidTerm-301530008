# COMP229 Mid-Term Test – Fran's Campus Lost & Found REST API

**Francis Torres — 301530008**

REST API for a campus lost & found board, built on the provided starter project
(Node.js, Express, MongoDB, Mongoose, TypeScript). Signup / signin and JWT
authentication were provided; the Item model validation, HTTP input validation,
the seven item controllers and the item routes are implemented here.

- Implementation notes: [`IMPLEMENTATION.md`](IMPLEMENTATION.md)
- Postman collection: [`postman/Fran-LostFound.postman_collection.json`](postman/Fran-LostFound.postman_collection.json)
- Test screenshots: [`screenshots/`](screenshots/)

---

## 1. Project Setup

### Prerequisites

- Node.js 24+ and npm
- A running MongoDB instance (local `mongod`, Docker, or MongoDB Atlas)

### Install

```bash
npm install
```

### Configure environment variables

Copy `.env.example` to `.env` and edit the values:

```bash
cp .env.example .env
```

```ini
PORT=8080
MONGODB_URI=mongodb://127.0.0.1:27017/comp229_midterm_fran
JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRES_IN=1d
```

### Run the server

```bash
npm run dev   # auto-restarts on file changes (tsx watch)
# or
npm run build && npm start
```

On a successful start you should see:

```
[db] Connected to MongoDB: comp229_midterm_fran
[server] Listening on http://localhost:8080 (development)
```

Visit `http://localhost:8080/` (Swagger docs at `http://localhost:8080/api/docs`) to see a JSON summary of the available routes.

---

## 2. Project Structure

```
.
├── server.ts                 # Bootstrap: env, DB connection, graceful shutdown
├── app.ts                    # Express app factory
├── config/                   # db.ts, env.ts, swagger.ts
├── middleware/
│   ├── auth.ts               # JWT auth middleware (provided)
│   ├── validateItem.ts       # HTTP input validation for item routes
│   └── errorHandlers.ts      # 404 + error → status code mapping
├── models/
│   ├── User.ts               # User model (provided)
│   └── Item.ts               # Item model: validation + unique title index
├── controllers/
│   ├── authController.ts     # signup/signin/me (provided)
│   └── itemController.ts     # 7 item handlers (implemented)
├── routes/
│   ├── authRoutes.ts         # /api/auth/*
│   └── itemRoutes.ts         # /api/items/*
├── postman/                  # Postman collection + generator script
├── screenshots/              # Postman & MongoDB Compass test evidence
├── .env.example
├── README.md
└── IMPLEMENTATION.md
```

---

## 3. REST API Reference

Base URL: `http://localhost:8080`

### Authentication (provided — do not change)

| Method | URL                | Auth    | Body                             |
|--------|--------------------|---------|----------------------------------|
| POST   | `/api/auth/signup` | Public  | `{ name, email, password }`      |
| POST   | `/api/auth/signin` | Public  | `{ email, password }`            |
| GET    | `/api/auth/me`     | Bearer  | —                                |

Both `signup` and `signin` respond with:

```json
{
  "token": "<JWT>",
  "user": { "_id": "...", "name": "...", "email": "...", "createdAt": "...", "updatedAt": "..." }
}
```

Protected endpoints require the header:

```
Authorization: Bearer <JWT>
```

### Items

| Method | URL                 | Auth    | Description                                           |
|--------|---------------------|---------|-------------------------------------------------------|
| GET    | `/api/items`        | Public  | List all items. Filters: `?type=`, `?category=`       |
| GET    | `/api/items/mine`   | Bearer  | List items owned by the signed-in user                |
| GET    | `/api/items/:id`    | Public  | Get a single item by id                               |
| POST   | `/api/items`        | Bearer  | Create a new item (owner = current user), avoid duplicated items, use title as unique field. |
| PUT    | `/api/items/:id`    | Bearer  | Update an item — **owner only**                       |
| DELETE | `/api/items/mine`   | Bearer  | Delete all items owned by the signed-in user          |
| DELETE | `/api/items/:id`    | Bearer  | Delete an item — **owner only**                       |

#### Required status codes

| Situation                       | Status |
|---------------------------------|--------|
| Success (GET / PUT)             | 200    |
| Success (POST / create)         | 201    |
| Successful delete               | 200 or 204 |
| Invalid request body / bad id   | 400    |
| Missing / invalid JWT           | 401    |
| User is not the item's owner    | 403    |
| Item not found                  | 404    |
| Duplicate title                 | 409    |
| Unexpected server error         | 500    |

### Item schema

| Field         | Type     | Rules                                                                 |
|---------------|----------|-----------------------------------------------------------------------|
| `title`       | String   | required, trimmed, 2–100 chars, **unique (case-insensitive)**         |
| `description` | String   | required, trimmed, 5–1000 chars                                       |
| `type`        | String   | required; `Lost` or `Found`                                           |
| `category`    | String   | required; `Electronics`, `Clothing`, `Books`, `Accessories`, `Other`  |
| `location`    | String   | required, trimmed, 2–200 chars                                        |
| `date`        | Date     | required; date the item was lost / found; cannot be in the future     |
| `status`      | String   | `Open` or `Returned`, default `Open`                                  |
| `owner`       | ObjectId | required; reference to the User who created the report (set in code) |
| `createdAt`   | Date     | automatic                                                             |
| `updatedAt`   | Date     | automatic                                                             |

---

## 4. Testing Guidance

You can test with **Postman**, **Thunder Client**, or `curl`. The flow is:

1. **Sign up** a user and copy the returned token.
2. Send that token as `Authorization: Bearer <token>` on protected routes.
3. Create a few items, list them, update one, delete one, etc.

### Example: curl

```bash
# 1. Sign up
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@my.centennialcollege.ca","password":"secret123"}'

# 2. Sign in
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@my.centennialcollege.ca","password":"secret123"}' | jq -r .token)

# 3. Create an item
curl -X POST http://localhost:8080/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Blue Hydro Flask",
    "description": "Dented bottom, has a sticker of a cat",
    "type": "Found",
    "category": "Accessories",
    "location": "Library 3rd floor",
    "date": "2026-10-20"
  }'

# 4. List all items filtered by type
curl "http://localhost:8080/api/items?type=Found&category=Accessories"

# 5. List mine
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/items/mine

# 6. Update
curl -X PUT http://localhost:8080/api/items/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"Returned"}'

# 7. Delete
curl -X DELETE -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/items/<id>

# 8. Delete all mine
curl -X DELETE -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/items/mine
```

### Postman collection — minimum tests to show the marker

- ✅ Signup returns 201 with a token
- ✅ Signin returns 200 with a token; wrong password returns 401
- ✅ `GET /api/items` returns 200 and respects `?type=` and `?category=`
- ✅ `POST /api/items` without a token returns 401
- ✅ `POST /api/items` with valid body + token returns 201
- ✅ `POST /api/items` missing a required field returns 400
- ✅ `GET /api/items/:id` with a bogus id returns 400; with a valid-but-missing id returns 404
- ✅ `GET /api/items/mine` returns only the current user's items
- ✅ `PUT /api/items/:id` by someone else returns 403
- ✅ `DELETE /api/items/:id` by the owner returns 200/204 and the item is gone
- ✅ `DELETE /api/items/mine` returns a `deletedCount` and empties `GET /api/items/mine`

---

## 5. Submission

- Folder / archive: `COMP229-MidTerm-301530008` (no `node_modules/`, `dist/` or `.env`)
- Repository: https://github.com/francismtorres/COMP229-MidTerm-301530008
- Test evidence: `COMP229-MidTerm-301530008-Test-Screenshots.docx` (Postman + MongoDB Compass)
