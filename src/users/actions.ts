import { randomUUID, createHash } from "crypto";
import { db } from "../../db";

function generateToken() {
  return randomUUID();
}

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}
export type RegisterUserProps = {
  username: string;
  password: string;
};

export async function registerUser({ username, password }: RegisterUserProps) {
  try {
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [
      username,
      hashPassword(password),
    ]);

    return { success: true, message: "User registered successfully" };
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      console.error("Error: Username already exists");
      return { success: false, message: "Username already exists" };
    } else {
      console.error("Error registering user:", error.message);
      return {
        success: false,
        message: "An error occurred during registration",
      };
    }
  }
}

export async function loginUser({ username, password }: RegisterUserProps) {
  const hashedPassword = hashPassword(password);

  // Check if the user exists
  const user = db
    .query<{ id: number; username: string; password: string }, any>(
      `SELECT id, password FROM users WHERE username = '${username}'`
    )
    .get();

  if (!user || hashedPassword !== user.password) {
    console.error("Invalid username or password");
    return null;
  }
  if (user && hashedPassword === user.password) {
    // Generate a token and expiration date
    console.log("Is correct password");
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 3600 * 1000); // Token valid for 1 hour

    // Store the token in the database
    db.run("INSERT INTO tokens (user_id, token, expires_at) VALUES (?, ?, ?)", [
      user.id,
      token,
      expiresAt.toISOString(),
    ]);

    console.log("Login successful. Token generated:", token);

    return token;
  }
}

export function verifyToken(token: string) {
  const result: any = db
    .query(
      `SELECT t.token, t.expires_at, u.username FROM tokens t INNER JOIN users u ON t.user_id = u.id WHERE t.token = "${token}"`
    )
    .get();

  if (!result) {
    console.error("Invalid token");
    return null;
  }

  const now = new Date();
  const expiresAt = new Date(result.expires_at);
  if (expiresAt < now) {
    console.error("Token expired");
    return null;
  }

  console.log("Token is valid for user:", result.username);
  return result.username; // Return associated username or user info
}

export function revokeToken(token: string) {
  db.run("DELETE FROM tokens WHERE token = ?", [token]);
  console.log("Token revoked");
}
