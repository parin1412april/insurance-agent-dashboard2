import { readFileSync } from "fs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const csv = readFileSync("/home/ubuntu/upload/whitelist_emails_20260311_103700.csv", "utf-8");
const lines = csv.trim().split("\n").slice(1); // skip header

const seen = new Set();
const rows = [];

for (const line of lines) {
  const parts = line.split(",");
  const email = (parts[1] || "").trim().toLowerCase();
  const name = (parts[2] || "").trim();
  const note = (parts[3] || "").trim();
  const isActive = parseInt(parts[4] || "1", 10);
  
  if (!email || seen.has(email)) continue;
  seen.add(email);
  rows.push({ email, name, note: note || null, isActive });
}

console.log(`Inserting ${rows.length} unique emails...`);

for (const row of rows) {
  try {
    await connection.execute(
      `INSERT INTO whitelist_emails (email, name, note, isActive) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), note = VALUES(note), isActive = VALUES(isActive)`,
      [row.email, row.name, row.note, row.isActive]
    );
    console.log(`  ✓ ${row.email}`);
  } catch (err) {
    console.error(`  ✗ ${row.email}: ${err.message}`);
  }
}

await connection.end();
console.log("Done!");
process.exit(0);
