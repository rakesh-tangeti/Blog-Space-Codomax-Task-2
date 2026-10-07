const API_BASE = "/api";

const defaultImage =
  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80";

function getToken() {
  return localStorage.getItem("blogspace_token");
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("blogspace_user") || "null");
}

function saveSession(data) {
  localStorage.setItem("blogspace_token", data.token);
  localStorage.setItem("blogspace_user", JSON.stringify(data.user));
}

function clearSession() {
  localStorage.removeItem("blogspace_token");
  localStorage.removeItem("blogspace_user");
}

async function apiRequest(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: "The server returned an invalid response."
  }));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function renderBlogs(target, blogs, withActions = false) {
  if (!target) return;

  target.innerHTML = blogs.map((blog) => `
    <article class="blog-card">
      <div class="blog-image"
        style="background-image:url('${escapeHTML(blog.image || defaultImage)}')">
      </div>

      <div class="blog-body">
        <span class="tag">${escapeHTML(blog.category)}</span>

        <h3>${escapeHTML(blog.title)}</h3>

        <p>
          ${escapeHTML(blog.content.slice(0, 135))}
          ${blog.content.length > 135 ? "…" : ""}
        </p>

        <div class="meta">
          <span>${escapeHTML(blog.author || "You")}</span>
          <span>${escapeHTML(blog.date || "")}</span>
        </div>

        ${
          withActions
            ? `<div class="card-actions">
                 <button class="small-btn delete" onclick="deleteBlog('${blog.id}')">
                   Delete
                 </button>
               </div>`
            : ""
        }
      </div>
    </article>
  `).join("");
}

async function loadHomeBlogs() {
  const blogGrid = document.getElementById("blogGrid");
  if (!blogGrid) return;

  try {
    const data = await apiRequest("/blogs");
    renderBlogs(blogGrid, data.blogs);
  } catch (error) {
    blogGrid.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
  }
}

async function loadDashboard() {
  const dashboardGrid = document.getElementById("dashboardGrid");
  if (!dashboardGrid) return;

  const token = getToken();

  if (!token) {
    alert("Please login first.");
    location.href = "login.html";
    return;
  }

  try {
    const me = await apiRequest("/auth/me");
    const user = me.user;

    localStorage.setItem("blogspace_user", JSON.stringify(user));

    document.getElementById("welcomeUser").textContent =
      `Welcome, ${user.name}`;

    const data = await apiRequest(`/blogs?userId=${encodeURIComponent(user.id)}`);

    const personal = data.blogs.filter(
      (blog) => blog.userId === user.id
    );

    renderBlogs(dashboardGrid, personal, true);

    document.getElementById("postCount").textContent = personal.length;

    const wordCount = personal.reduce((total, blog) => {
      return total + blog.content.trim().split(/\s+/).filter(Boolean).length;
    }, 0);

    document.getElementById("wordCount").textContent = wordCount;

    document.getElementById("emptyState").style.display =
      personal.length ? "none" : "block";
  } catch (error) {
    clearSession();
    alert(error.message);
    location.href = "login.html";
  }
}

// -----------------------------------------------------------------------------
// Register -> POST /api/auth/register
// -----------------------------------------------------------------------------

const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirm = document.getElementById("registerConfirm").value;

    if (password !== confirm) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password
        })
      });

      alert(data.message);
      registerForm.reset();
      location.href = "login.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

// -----------------------------------------------------------------------------
// Login -> POST /api/auth/login
// -----------------------------------------------------------------------------

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password
        })
      });

      saveSession(data);

      alert(data.message);
      location.href = "dashboard.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

// -----------------------------------------------------------------------------
// Create Blog -> POST /api/blogs
// -----------------------------------------------------------------------------

const blogForm = document.getElementById("blogForm");

if (blogForm) {
  blogForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!getToken()) {
      alert("Please login before creating a blog.");
      location.href = "login.html";
      return;
    }

    const title = document.getElementById("blogTitle").value.trim();
    const category = document.getElementById("blogCategory").value;
    const image = document.getElementById("blogImage").value.trim();
    const content = document.getElementById("blogContent").value.trim();

    if (!title || !content) {
      alert("Please fill in the title and content.");
      return;
    }

    try {
      const data = await apiRequest("/blogs", {
        method: "POST",
        body: JSON.stringify({
          title,
          category,
          image,
          content
        })
      });

      alert(data.message);
      blogForm.reset();
      location.href = "dashboard.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

// -----------------------------------------------------------------------------
// Delete Blog -> DELETE /api/blogs/:id
// -----------------------------------------------------------------------------

async function deleteBlog(id) {
  if (!confirm("Delete this blog?")) return;

  try {
    const data = await apiRequest(`/blogs/${id}`, {
      method: "DELETE"
    });

    alert(data.message);
    loadDashboard();
  } catch (error) {
    alert(error.message);
  }
}

window.deleteBlog = deleteBlog;

// -----------------------------------------------------------------------------
// Logout -> POST /api/auth/logout
// -----------------------------------------------------------------------------

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      if (getToken()) {
        await apiRequest("/auth/logout", {
          method: "POST"
        });
      }
    } catch (_) {
      // Clear local session even if the server is unavailable.
    }

    clearSession();
    location.href = "index.html";
  });
}

// Load page-specific data.
loadHomeBlogs();
loadDashboard();
