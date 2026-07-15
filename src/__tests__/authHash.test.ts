import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";

describe("password hashing", () => {
  it("hashes and verifies staff passwords", async () => {
    const hash = await bcrypt.hash("admin123", 10);
    expect(await bcrypt.compare("admin123", hash)).toBe(true);
    expect(await bcrypt.compare("wrong", hash)).toBe(false);
  });
});
