# BlogSpace – Codomax Task 2

Task 2 upgrades the Task 1 BlogSpace frontend with a Node.js + Express.js REST API backend.

## Task 2 requirements covered

- Node.js backend server
- Express.js
- REST APIs
- User Registration API
- User Login API
- Create Blog API
- Frontend connected to backend using `fetch()`
- No database / MongoDB
- Temporary in-memory server storage

## API endpoints

### Health
`GET /api/health`

### Register
`POST /api/auth/register`

Request:
```json
{
  "name": "Rakesh",
  "email": "rakesh@gmail.com",
  "password": "123456"
}
```

### Login
`POST /api/auth/login`

Request:
```json
{
  "email": "rakesh@gmail.com",
  "password": "123456"
}
```

The response contains a temporary authentication token.

### Create Blog
`POST /api/blogs`

Header:
```text
Authorization: Bearer YOUR_TOKEN
```

Request:
```json
{
  "title": "My First Blog",
  "category": "Technology",
  "image": "https://example.com/image.jpg",
  "content": "This is my first blog post."
}
```

## Supporting endpoints

These are included to keep the existing Task 1 dashboard fully connected to the backend:

- `GET /api/blogs`
- `GET /api/blogs?userId=USER_ID`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `DELETE /api/blogs/:id`

## How to run

Open the project folder in VS Code.

### 1. Install dependencies

```bash
npm install
```

### 2. Start the server

```bash
npm start
```

For development:

```bash
npm run dev
```

### 3. Open the application

Open:

```text
http://localhost:5000
```

Do not open the HTML files directly with `file://`.

## Important Task 2 limitation

There is intentionally **no database** in this version because database integration is planned for Task 3.

The following are stored temporarily in server memory:

- registered users
- login sessions
- user-created blogs

Restarting the Node.js server clears that data.

Task 3 can replace the arrays with MongoDB/database models without changing the frontend API contract.

## Project structure

```text
Blog-Space-Codomax-Task-2/
│
├── css/
│   └── style.css
│
├── js/
│   └── script.js
│
├── create-blog.html
├── dashboard.html
├── index.html
├── login.html
├── register.html
│
├── server.js
├── package.json
├── .gitignore
└── README.md
```

## Task 2 flow

```text
Frontend
   |
   | fetch()
   v
Express REST API
   |
   +--> Register
   |
   +--> Login
   |
   +--> Create Blog
   |
   v
Temporary in-memory arrays
```

## Security note

Passwords are hashed with Node.js `crypto.scryptSync()` instead of being stored as plain text. The session token is also generated server-side.

This is a learning implementation. Persistent database storage, production session management and other production security controls can be added in Task 3.
