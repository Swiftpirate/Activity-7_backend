// Create and export the PostgreSQL connection pool.
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render's Internal Database URL needs no SSL. Set DATABASE_SSL=true when using the External URL.
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false
});

// If the database drops an idle connection, log it instead of crashing the server.
pool.on("error", error => {
  console.error("Database connection error:", error.message);
});

// Create the table, and add the seed records only once (when the table is empty).
pool.init = async function init() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);

  const result = await pool.query("SELECT COUNT(*) AS total FROM records");
  if (Number(result.rows[0].total) === 0) {
    const seed = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");
    await pool.query(seed);
    console.log("Seed records added.");
  }
};

module.exports = pool;
