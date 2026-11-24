require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
app.set("trust proxy", true); // Render sits behind a proxy, so this gives the real https address

const origins = (process.env.CLIENT_ORIGINS || "")
  .split(",").map(value => value.trim()).filter(Boolean);
app.use(cors({ origin: origins }));
app.use(express.json());

// GET / - API guide for the marker
app.get("/", (req, res) => {
  const base = `${req.protocol}://${req.get("host")}`;
  res.status(200).type("html").send(guidePage(base));
});

// GET /health - check that the server and database respond
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({ message: "Database is not responding." });
  }
});

// Record routes
app.use("/api/records", require("./routes/records"));

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} does not exist.` });
});

// Error handler (four parameters)
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "The request body is not valid JSON." });
  }
  if (error.status && error.status < 500) {
    return res.status(error.status).json({ message: error.message });
  }
  console.error(error);
  res.status(500).json({ message: "Something went wrong on the server. Please try again." });
});

const port = process.env.PORT || 3000;
pool.init()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch(error => {
    console.error("Could not set up the database:", error);
    process.exit(1);
  });

// ---------- API guide page ----------
function guidePage(base) {
  const postBody = JSON.stringify({
    title: "Broken classroom light",
    category: "Electrical",
    description: "The light in Room B12 does not switch on.",
    status: "Pending"
  }, null, 2);
  const putBody = JSON.stringify({
    title: "Broken classroom light",
    category: "Electrical",
    description: "The light in Room B12 has been replaced.",
    status: "Completed"
  }, null, 2);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Campus Maintenance Requests API</title>
  <style>
    body { font-family: system-ui, Arial, sans-serif; max-width: 860px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; color: #1d2733; }
    h1 { color: #1456a0; margin-bottom: .25rem; }
    table { border-collapse: collapse; width: 100%; margin: .5rem 0 1rem; }
    th, td { border: 1px solid #c9d3df; padding: .45rem .6rem; text-align: left; vertical-align: top; }
    th { background: #eef3f9; }
    code, pre { background: #f3f5f8; border-radius: 4px; }
    code { padding: .1rem .3rem; }
    pre { padding: .75rem; overflow-x: auto; }
    .note { background: #fff7e0; border-left: 4px solid #e0a800; padding: .6rem .8rem; }
  </style>
</head>
<body>
  <h1>Campus Maintenance Requests API</h1>
  <p><strong>Project name:</strong> Campus Maintenance Requests<br>
     <strong>Student number:</strong> 202501555<br>
     <strong>Course:</strong> ICT251 Introduction to Web Technologies, Activity 7</p>
  <p>This Node.js and Express API stores campus maintenance requests (broken lights, taps, furniture and similar problems) in a PostgreSQL database hosted on Render. Any client that sends JSON can read, create, update and delete records.</p>

  <h2>Base URL</h2>
  <p><code>${base}</code></p>
  <p>Quick links: <a href="${base}/health">/health</a> &middot; <a href="${base}/api/records">/api/records</a></p>

  <h2>Routes</h2>
  <table>
    <tr><th>Method</th><th>Route</th><th>Purpose</th><th>Success</th></tr>
    <tr><td>GET</td><td><code>/</code></td><td>This API guide</td><td>200</td></tr>
    <tr><td>GET</td><td><code>/health</code></td><td>Check that the server and database respond</td><td>200</td></tr>
    <tr><td>GET</td><td><code>/api/records</code></td><td>Read all records (an empty array when there are none)</td><td>200</td></tr>
    <tr><td>GET</td><td><code>/api/records/:id</code></td><td>Read one record</td><td>200</td></tr>
    <tr><td>POST</td><td><code>/api/records</code></td><td>Create a record; returns it with its new id</td><td>201</td></tr>
    <tr><td>PUT</td><td><code>/api/records/:id</code></td><td>Replace the four editable fields; returns the updated record</td><td>200</td></tr>
    <tr><td>DELETE</td><td><code>/api/records/:id</code></td><td>Delete a record; returns <code>{"message":"Record deleted."}</code></td><td>200</td></tr>
  </table>

  <h2>Input fields</h2>
  <table>
    <tr><th>Field</th><th>Rule</th></tr>
    <tr><td><code>title</code></td><td>Text, 3 to 80 characters</td></tr>
    <tr><td><code>category</code></td><td>Text, 2 to 40 characters (e.g. Electrical, Plumbing, Furniture)</td></tr>
    <tr><td><code>description</code></td><td>Text, 5 to 300 characters</td></tr>
    <tr><td><code>status</code></td><td>Exactly one of: <code>Pending</code>, <code>In progress</code>, <code>Completed</code></td></tr>
  </table>
  <p>Spaces at the start and end are trimmed before checking. Do not send <code>id</code>; the database generates it, and any id in the body is ignored. Send the body as raw JSON with the header <code>Content-Type: application/json</code>.</p>

  <h3>Valid POST body</h3>
  <pre>${postBody}</pre>
  <h3>Valid PUT body (all four fields are required)</h3>
  <pre>${putBody}</pre>

  <h2>Status codes</h2>
  <table>
    <tr><th>Code</th><th>Meaning</th></tr>
    <tr><td>200</td><td>Success (GET, PUT, DELETE)</td></tr>
    <tr><td>201</td><td>Record created (POST)</td></tr>
    <tr><td>400</td><td>Invalid input, invalid id or malformed JSON</td></tr>
    <tr><td>404</td><td>Record or route does not exist</td></tr>
    <tr><td>500</td><td>Unexpected server failure</td></tr>
    <tr><td>503</td><td>Database not responding (from /health)</td></tr>
  </table>
  <p>Every error is returned as JSON with a <code>message</code> field, for example <code>{"message":"Title must have 3 to 80 characters."}</code></p>

  <p class="note">This service is hosted on Render's free plan, which pauses when idle. The first request after a quiet period may take up to a minute while it starts.</p>
</body>
</html>`;
}
