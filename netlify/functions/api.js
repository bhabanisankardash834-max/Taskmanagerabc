// ============================================================
// netlify/functions/api.js
// Single serverless function handling all API routes
// Routes: /api/auth/* and /api/tasks/*
// ============================================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

// -------------------------------------------------------
// MONGODB CONNECTION (cached across warm invocations)
// -------------------------------------------------------
let cachedDb = null;

async function connectDB() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    dbName: "Taskmanagerabc",
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  cachedDb = conn;
  return cachedDb;
}

// -------------------------------------------------------
// MODELS
// -------------------------------------------------------
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// -------------------------------------------------------

const TaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    dueDate: { type: Date, default: null },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TaskSchema.index({ userId: 1 });

const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);

// -------------------------------------------------------
// HELPERS
// -------------------------------------------------------
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });

const parseBody = (event) => {
  try {
    return event.body ? JSON.parse(event.body) : {};
  } catch {
    return {};
  }
};

const getHeaders = () => ({
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
});

const resp = (statusCode, body) => ({
  statusCode,
  headers: getHeaders(),
  body: JSON.stringify(body),
});

// Auth middleware (inline)
const verifyToken = async (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw { status: 401, message: "Access denied. No token provided." };
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) throw { status: 401, message: "User not found. Token may be invalid." };
    return user;
  } catch (err) {
    if (err.status) throw err;
    throw { status: 401, message: "Invalid or expired token. Please log in again." };
  }
};

// Validation helper (manual, no express-validator in serverless)
const validateRegisterBody = (body) => {
  const errors = [];
  if (!body.name || !body.name.trim()) errors.push("Name is required");
  else if (body.name.trim().length > 50) errors.push("Name cannot exceed 50 characters");
  if (!body.email || !body.email.trim()) errors.push("Email is required");
  else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(body.email)) errors.push("Please provide a valid email");
  if (!body.password) errors.push("Password is required");
  else if (body.password.length < 6) errors.push("Password must be at least 6 characters");
  return errors;
};

const validateLoginBody = (body) => {
  const errors = [];
  if (!body.email || !body.email.trim()) errors.push("Email is required");
  if (!body.password) errors.push("Password is required");
  return errors;
};

const validateTaskBody = (body) => {
  const errors = [];
  if (!body.title || !body.title.trim()) errors.push("Task title is required");
  else if (body.title.trim().length > 100) errors.push("Title cannot exceed 100 characters");
  if (body.description && body.description.length > 500) errors.push("Description cannot exceed 500 characters");
  if (body.priority && !["Low", "Medium", "High"].includes(body.priority)) errors.push("Priority must be Low, Medium, or High");
  if (body.dueDate && isNaN(Date.parse(body.dueDate))) errors.push("Please provide a valid date");
  return errors;
};

// -------------------------------------------------------
// ROUTE HANDLERS
// -------------------------------------------------------

// POST /api/auth/register
async function authRegister(event) {
  const body = parseBody(event);
  const errors = validateRegisterBody(body);
  if (errors.length) return resp(400, { success: false, message: errors[0] });

  const { name, email, password } = body;
  const existing = await User.findOne({ email });
  if (existing) return resp(400, { success: false, message: "An account with this email already exists" });

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  return resp(201, {
    success: true,
    message: "Account created successfully!",
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
}

// POST /api/auth/login
async function authLogin(event) {
  const body = parseBody(event);
  const errors = validateLoginBody(body);
  if (errors.length) return resp(400, { success: false, message: errors[0] });

  const { email, password } = body;
  const user = await User.findOne({ email }).select("+password");
  if (!user) return resp(401, { success: false, message: "Invalid email or password" });

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return resp(401, { success: false, message: "Invalid email or password" });

  const token = generateToken(user._id);
  return resp(200, {
    success: true,
    message: "Login successful!",
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
}

// GET /api/auth/me
async function authMe(event) {
  const user = await verifyToken(event);
  return resp(200, {
    success: true,
    user: { id: user._id, name: user.name, email: user.email },
  });
}

// GET /api/tasks/stats
async function taskStats(event) {
  const user = await verifyToken(event);
  const now = new Date();
  const stats = await Task.aggregate([
    { $match: { userId: user._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: ["$completed", 1, 0] } },
        pending: { $sum: { $cond: ["$completed", 0, 1] } },
        overdue: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$completed", false] }, { $lt: ["$dueDate", now] }, { $ne: ["$dueDate", null] }] },
              1, 0,
            ],
          },
        },
      },
    },
  ]);
  const result = stats[0] || { total: 0, completed: 0, pending: 0, overdue: 0 };
  return resp(200, { success: true, stats: { total: result.total, completed: result.completed, pending: result.pending, overdue: result.overdue } });
}

// GET /api/tasks
async function taskGetAll(event) {
  const user = await verifyToken(event);
  const qs = event.queryStringParameters || {};
  const { status, search, sort, priority } = qs;

  let query = { userId: user._id };
  if (status === "completed") query.completed = true;
  if (status === "pending") query.completed = false;
  if (priority && ["Low", "Medium", "High"].includes(priority)) query.priority = priority;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  let sortOption = { createdAt: -1 };
  if (sort === "oldest") sortOption = { createdAt: 1 };
  if (sort === "priority") sortOption = { priority: -1, createdAt: -1 };
  if (sort === "dueDate") sortOption = { dueDate: 1 };

  const tasks = await Task.find(query).sort(sortOption);
  return resp(200, { success: true, count: tasks.length, tasks });
}

// POST /api/tasks
async function taskCreate(event) {
  const user = await verifyToken(event);
  const body = parseBody(event);
  const errors = validateTaskBody(body);
  if (errors.length) return resp(400, { success: false, message: errors[0] });

  const { title, description, priority, dueDate } = body;
  const task = await Task.create({
    userId: user._id,
    title,
    description,
    priority,
    dueDate: dueDate || null,
  });
  return resp(201, { success: true, message: "Task created successfully!", task });
}

// GET /api/tasks/:id
async function taskGetOne(event, id) {
  const user = await verifyToken(event);
  const task = await Task.findById(id);
  if (!task) return resp(404, { success: false, message: "Task not found" });
  if (task.userId.toString() !== user._id.toString())
    return resp(403, { success: false, message: "Access denied. You can only view your own tasks." });
  return resp(200, { success: true, task });
}

// PUT /api/tasks/:id
async function taskUpdate(event, id) {
  const user = await verifyToken(event);
  const body = parseBody(event);
  const errors = validateTaskBody(body);
  if (errors.length) return resp(400, { success: false, message: errors[0] });

  let task = await Task.findById(id);
  if (!task) return resp(404, { success: false, message: "Task not found" });
  if (task.userId.toString() !== user._id.toString())
    return resp(403, { success: false, message: "Access denied. You can only edit your own tasks." });

  const { title, description, priority, dueDate, completed } = body;
  task = await Task.findByIdAndUpdate(
    id,
    { title, description, priority, dueDate, completed },
    { new: true, runValidators: true }
  );
  return resp(200, { success: true, message: "Task updated successfully!", task });
}

// PATCH /api/tasks/:id/toggle
async function taskToggle(event, id) {
  const user = await verifyToken(event);
  const task = await Task.findById(id);
  if (!task) return resp(404, { success: false, message: "Task not found" });
  if (task.userId.toString() !== user._id.toString())
    return resp(403, { success: false, message: "Access denied." });
  task.completed = !task.completed;
  await task.save();
  return resp(200, { success: true, message: `Task marked as ${task.completed ? "completed" : "pending"}`, task });
}

// DELETE /api/tasks/completed/all
async function taskDeleteCompleted(event) {
  const user = await verifyToken(event);
  const result = await Task.deleteMany({ userId: user._id, completed: true });
  return resp(200, { success: true, message: `${result.deletedCount} completed task(s) deleted` });
}

// DELETE /api/tasks/:id
async function taskDelete(event, id) {
  const user = await verifyToken(event);
  const task = await Task.findById(id);
  if (!task) return resp(404, { success: false, message: "Task not found" });
  if (task.userId.toString() !== user._id.toString())
    return resp(403, { success: false, message: "Access denied. You can only delete your own tasks." });
  await task.deleteOne();
  return resp(200, { success: true, message: "Task deleted successfully" });
}

// -------------------------------------------------------
// MAIN HANDLER - Router
// -------------------------------------------------------
exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: getHeaders(), body: "" };
  }

  try {
    await connectDB();
  } catch (err) {
    console.error("DB connection error:", err);
    return resp(500, { success: false, message: "Database connection failed" });
  }

  const method = event.httpMethod;
  // path comes in as /auth/register or /tasks/stats etc (after /api/ is stripped by redirect)
  const rawPath = event.path || "";
  // Netlify passes /.netlify/functions/api/auth/register — extract after /api/
  const path = rawPath.replace(/^\/.netlify\/functions\/api/, "").replace(/^\/api/, "") || "/";
  const segments = path.replace(/^\//, "").split("/"); // e.g. ['auth','register'] or ['tasks','stats']

  try {
    // ---- AUTH ROUTES ----
    if (segments[0] === "auth") {
      if (method === "POST" && segments[1] === "register") return await authRegister(event);
      if (method === "POST" && segments[1] === "login") return await authLogin(event);
      if (method === "GET" && segments[1] === "me") return await authMe(event);
    }

    // ---- TASK ROUTES ----
    if (segments[0] === "tasks") {
      // GET /tasks/stats
      if (method === "GET" && segments[1] === "stats") return await taskStats(event);

      // DELETE /tasks/completed/all
      if (method === "DELETE" && segments[1] === "completed" && segments[2] === "all") return await taskDeleteCompleted(event);

      // GET /tasks
      if (method === "GET" && !segments[1]) return await taskGetAll(event);

      // POST /tasks
      if (method === "POST" && !segments[1]) return await taskCreate(event);

      // Routes with :id
      const id = segments[1];
      if (id) {
        if (method === "GET" && !segments[2]) return await taskGetOne(event, id);
        if (method === "PUT" && !segments[2]) return await taskUpdate(event, id);
        if (method === "DELETE" && !segments[2]) return await taskDelete(event, id);
        if (method === "PATCH" && segments[2] === "toggle") return await taskToggle(event, id);
      }
    }

    return resp(404, { success: false, message: "Route not found" });
  } catch (err) {
    if (err.status) return resp(err.status, { success: false, message: err.message });
    console.error("Handler error:", err);
    return resp(500, { success: false, message: "Internal server error" });
  }
};
