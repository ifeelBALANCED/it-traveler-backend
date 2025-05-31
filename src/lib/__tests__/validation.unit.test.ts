import { describe, expect, it } from "bun:test";
import { isEmail } from "../validation";

describe("isEmail", () => {
  it("validates correct emails", () => {
    expect(isEmail("test@example.com")).toBe(true);
    expect(isEmail("user@domain.co.uk")).toBe(true);
  });
  it("invalidates wrong emails", () => {
    expect(isEmail("not-an-email")).toBe(false);
    expect(isEmail("@nope.com")).toBe(false);
    expect(isEmail("user@.com")).toBe(false);
    expect(isEmail("user@domain")).toBe(false);
  });
});
