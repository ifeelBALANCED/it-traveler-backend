import { describe, expect, it } from "bun:test";
import { comparePassword, hashPassword } from "../auth";

describe("auth utils", () => {
  it("hashes and compares password", async () => {
    const password = "test123";
    const hash = await hashPassword(password);
    expect(await comparePassword(password, hash)).toBe(true);
    expect(await comparePassword("wrong", hash)).toBe(false);
  });
});
