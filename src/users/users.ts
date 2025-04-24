import { db } from "../../db";
// Create a table
db.run(
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )`
);

const users = db.query<{ id: number, username: string, password: string }, any>("SELECT * FROM users").all();
// Function to fetch user info by token
export function getUserInfoByToken(token: string) {
  try {
    // Find the token and associated user info
    const result: any = db.query(`
      SELECT
        u.id AS user_id,
        u.username,
        t.token,
        t.expires_at
      FROM tokens t
      INNER JOIN users u ON t.user_id = u.id
      WHERE t.token = ?
    `).get(token);

    if (!result) {
      return { success: false, message: "Invalid token" };
    }

    // Check if the token is expired
    const now = new Date();
    const expiresAt = new Date(result.expires_at);
    if (expiresAt < now) {
      return { success: false, message: "Token expired" };
    }

    // Return the user info
    return {
      success: true,
      user: {
        id: result.user_id,
        username: result.username,
      },
    };
  } catch (error: any) {
    console.error("Error fetching user info:", error.message);
    return { success: false, message: "An error occurred while fetching user info" };
  }
}

export default users;
