import { db } from "../src/db.js";
import { hashPassword, newId, issueToken } from "../src/crypto-utils.js";

export function createTestUser({ role = "USER" } = {}) {
  const id = newId("usr");
  const { hash, salt } = hashPassword("Test1234!");
  db.prepare(`INSERT INTO users (id, name, email, password_hash, password_salt, role, token_version)
    VALUES (?, ?, ?, ?, ?, ?, 0)`).run(id, "Test User", `test-${id}@example.com`, hash, salt, role);
  const token = issueToken(id, 0);
  return { id, token, email: `test-${id}@example.com` };
}

export function cleanup() {
  // In-memory DB is recreated per process for tests
}
