import { describe, expect, it } from "vitest";
import { decodeSessionToken, encodeSessionToken } from "@/lib/session-token";

const SECRET = "a".repeat(64);

describe("session-token", () => {
  it("geeft het user-id terug bij een geldige handtekening", () => {
    const token = encodeSessionToken("user-123", SECRET);
    expect(decodeSessionToken(token, SECRET)).toBe("user-123");
  });

  it("weigert een aangepast user-id", () => {
    const token = encodeSessionToken("user-123", SECRET);
    const forged = token.replace("user-123", "user-456");
    expect(decodeSessionToken(forged, SECRET)).toBeNull();
  });

  it("weigert een token met een ander secret", () => {
    const token = encodeSessionToken("user-123", SECRET);
    expect(decodeSessionToken(token, "b".repeat(64))).toBeNull();
  });

  it("weigert lege of kapotte tokens", () => {
    expect(decodeSessionToken(undefined, SECRET)).toBeNull();
    expect(decodeSessionToken("", SECRET)).toBeNull();
    expect(decodeSessionToken("geen-punt", SECRET)).toBeNull();
  });
});
