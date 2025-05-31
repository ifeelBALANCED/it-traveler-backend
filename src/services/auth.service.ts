import { db } from "../lib/db";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import { RegisterRequest, LoginRequest, UserWithoutPassword } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "7d";
const SESSION_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static async generateToken(userId: string): Promise<string> {
    // Add timestamp to ensure unique tokens
    const tokenPayload = { userId, timestamp: Date.now() };
    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Delete any existing sessions for this token first (cleanup)
    await db.session.deleteMany({
      where: { token },
    });

    // Create session in database
    await db.session.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + SESSION_EXPIRES_IN_MS),
      },
    });

    return token;
  }

  static async verifyToken(token: string): Promise<string | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        timestamp?: number;
      };

      // Check if session exists and is valid
      const session = await db.session.findUnique({
        where: { token },
      });

      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      return decoded.userId;
    } catch {
      return null;
    }
  }

  static async register(data: RegisterRequest): Promise<UserWithoutPassword> {
    if (data.password !== data.confirmPassword) {
      throw new Error("Passwords do not match");
    }

    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await this.hashPassword(data.password);

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async login(
    data: LoginRequest
  ): Promise<{ user: UserWithoutPassword; token: string }> {
    const user = await db.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !(await this.comparePassword(data.password, user.password))) {
      throw new Error("Invalid email or password");
    }

    const token = await this.generateToken(user.id);
    const { password, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  static async logout(token: string): Promise<void> {
    await db.session.delete({
      where: { token },
    });
  }

  static async getUser(userId: string): Promise<UserWithoutPassword | null> {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async cleanupExpiredSessions(): Promise<void> {
    await db.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
