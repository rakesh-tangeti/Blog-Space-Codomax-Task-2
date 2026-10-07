const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the Task 1 frontend from the project root.
app.use(express.static(__dirname));

// -----------------------------------------------------------------------------
// Temporary in-memory storage
// IMPORTANT: Task 3 will replace this with a database.
// Restarting the server clears users, sessions and user-created blogs.
// -----------------------------------------------------------------------------

const users = [];
const sessions = new Map();

const blogs = [
  {
    id: "d1",
    title: "The future of digital creativity",
    category: "Technology",
    content:
      "Technology is changing the way we learn, build and express ideas. The best tools help people spend more time thinking creatively.",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
    date: "2026-08-21",
    author: "BlogSpace",
    userId: null
  },
  {
    id: "d2",
    title: "How to build better learning habits",
    category: "Education",
    content:
      "Small, consistent routines can make difficult topics easier to understand. Start with one focused learning block each day.",
    image:
      "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=900&q=80",
    date: "2026-08-20",
    author: "BlogSpace",
    userId: null
  },
  {
    id: "d3",
    title: "Designing interfaces people enjoy",
    category: "Design",
    content:
      "Good interface design balances clarity, hierarchy and emotion. Responsive layouts make that experience accessible everywhere.",
    image:
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=900&q=80",
    date: "2026-08-18",
    author: "BlogSpace",
    userId: null
  }
];

function createId(prefix = "") {
  return prefix + crypto.randomBytes(8).toString("hex");
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
  const [salt, storedHash] = storedPassword.split(":");
  if (!salt || !storedHash) return false;

  const derivedHash = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(storedHash, "hex");
  const b = Buffer.from(derivedHash, "hex");

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

function getAuthUser(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const userId = sessions.get(token);
  if (!userId) return null;

  return users.find((user) => user.id === userId) || null;
}

function requireAuth(req, res, next) {
  const user = getAuthUser(req);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please login first."
    });
  }

  req.user = user;
  next();
}

// -----------------------------------------------------------------------------
// API: Health check
// -----------------------------------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "BlogSpace backend is running",
    database: false,
    task: "Task 2 - Backend Development"
  });
});

// -----------------------------------------------------------------------------
// API: User Registration
// POST /api/auth/register
// -----------------------------------------------------------------------------

app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email and password are required."
    });
  }

  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPassword = String(password);

  if (cleanName.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Name must contain at least 2 characters."
    });
  }

  if (cleanPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must contain at least 6 characters."
    });
  }

  const existingUser = users.find((user) => user.email === cleanEmail);

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists."
    });
  }

  const user = {
    id: createId("user_"),
    name: cleanName,
    email: cleanEmail,
    password: hashPassword(cleanPassword),
    createdAt: new Date().toISOString()
  };

  users.push(user);

  res.status(201).json({
    success: true,
    message: "Registration successful. You can now login.",
    user: publicUser(user)
  });
});

// -----------------------------------------------------------------------------
// API: User Login
// POST /api/auth/login
// -----------------------------------------------------------------------------

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required."
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = users.find((item) => item.email === cleanEmail);

  if (!user || !verifyPassword(String(password), user.password)) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password."
    });
  }

  const token = createId("token_");
  sessions.set(token, user.id);

  res.json({
    success: true,
    message: "Login successful.",
    token,
    user: publicUser(user)
  });
});

// -----------------------------------------------------------------------------
// API: Logout
// POST /api/auth/logout
// -----------------------------------------------------------------------------

app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization || "";

  if (authHeader.startsWith("Bearer ")) {
    sessions.delete(authHeader.slice(7));
  }

  res.json({
    success: true,
    message: "Logged out successfully."
  });
});

// -----------------------------------------------------------------------------
// API: Get current logged-in user
// GET /api/auth/me
// -----------------------------------------------------------------------------

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    user: publicUser(req.user)
  });
});

// -----------------------------------------------------------------------------
// API: Create Blog
// POST /api/blogs
// -----------------------------------------------------------------------------

app.post("/api/blogs", requireAuth, (req, res) => {
  const { title, category, image, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      message: "Blog title and content are required."
    });
  }

  const blog = {
    id: createId("blog_"),
    title: String(title).trim(),
    category: String(category || "Other").trim(),
    image: String(image || "").trim(),
    content: String(content).trim(),
    date: new Date().toISOString().slice(0, 10),
    author: req.user.name,
    userId: req.user.id
  };

  blogs.push(blog);

  res.status(201).json({
    success: true,
    message: "Blog published successfully!",
    blog
  });
});

// -----------------------------------------------------------------------------
// Supporting API: Get blogs
// This keeps the Task 1 home/dashboard UI working with backend data.
// -----------------------------------------------------------------------------

app.get("/api/blogs", (req, res) => {
  const requestedUserId = req.query.userId;

  let result = blogs;

  if (requestedUserId) {
    result = blogs.filter(
      (blog) => blog.userId === requestedUserId || blog.author === "BlogSpace"
    );
  }

  res.json({
    success: true,
    blogs: result.slice().reverse()
  });
});

// -----------------------------------------------------------------------------
// Supporting API: Delete own blog
// Existing Task 1 dashboard has a Delete button.
// -----------------------------------------------------------------------------

app.delete("/api/blogs/:id", requireAuth, (req, res) => {
  const index = blogs.findIndex(
    (blog) => blog.id === req.params.id && blog.userId === req.user.id
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Blog not found or you are not allowed to delete it."
    });
  }

  blogs.splice(index, 1);

  res.json({
    success: true,
    message: "Blog deleted successfully."
  });
});

// Unknown API route
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`BlogSpace Task 2 server running at http://localhost:${PORT}`);
  console.log(`API health check: http://localhost:${PORT}/api/health`);
});