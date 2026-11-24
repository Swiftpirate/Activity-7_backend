const router = require("express").Router();
const pool = require("../db");

const STATUSES = ["Pending", "In progress", "Completed"];
const FIELDS = "id, title, category, description, status";

// Make an error that the error handler turns into a JSON response.
function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// The id must be a positive whole number, e.g. 1, 2, 3.
function readId(req) {
  const text = req.params.id;
  if (!/^[1-9]\d*$/.test(text) || Number(text) > 2147483647) {
    throw httpError(400, "Id must be a positive whole number.");
  }
  return Number(text);
}

// Check the four editable fields. Any id sent by the client is ignored.
function readBody(req) {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw httpError(400, "Send a JSON object with title, category, description and status.");
  }

  const rules = [
    ["title", "Title", 3, 80],
    ["category", "Category", 2, 40],
    ["description", "Description", 5, 300]
  ];
  const record = {};
  for (const [key, label, min, max] of rules) {
    if (typeof body[key] !== "string") {
      throw httpError(400, `${label} is required and must be text.`);
    }
    const value = body[key].trim();
    if (value.length < min || value.length > max) {
      throw httpError(400, `${label} must have ${min} to ${max} characters.`);
    }
    record[key] = value;
  }

  if (typeof body.status !== "string" || !STATUSES.includes(body.status.trim())) {
    throw httpError(400, "Status must be Pending, In progress or Completed.");
  }
  record.status = body.status.trim();
  return record;
}

// GET /api/records - read all records
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT ${FIELDS} FROM records ORDER BY id`);
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/records/:id - read one record
router.get("/:id", async (req, res, next) => {
  try {
    const id = readId(req);
    const result = await pool.query(
      `SELECT ${FIELDS} FROM records WHERE id = $1`,
      [id]
    );
    if (result.rowCount === 0) throw httpError(404, `Record ${id} was not found.`);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/records - create a record
router.post("/", async (req, res, next) => {
  try {
    const r = readBody(req);
    const result = await pool.query(
      `INSERT INTO records (title, category, description, status)
       VALUES ($1, $2, $3, $4) RETURNING ${FIELDS}`,
      [r.title, r.category, r.description, r.status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// PUT /api/records/:id - replace the four editable fields
router.put("/:id", async (req, res, next) => {
  try {
    const id = readId(req);
    const r = readBody(req);
    const result = await pool.query(
      `UPDATE records SET title = $1, category = $2, description = $3, status = $4
       WHERE id = $5 RETURNING ${FIELDS}`,
      [r.title, r.category, r.description, r.status, id]
    );
    if (result.rowCount === 0) throw httpError(404, `Record ${id} was not found.`);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/records/:id - delete a record
router.delete("/:id", async (req, res, next) => {
  try {
    const id = readId(req);
    const result = await pool.query(
      "DELETE FROM records WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rowCount === 0) throw httpError(404, `Record ${id} was not found.`);
    res.status(200).json({ message: "Record deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
