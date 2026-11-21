import { beforeAll, describe, expect, it, vi } from "vitest";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTVerifyGetKey } from "jose";

vi.mock("server-only", () => ({}));
import { GITHUB_OIDC_ISSUER, OIDC_AUDIENCE, isAuthorizedCron, isGithubActionsToken } from "@/lib/github-oidc";

let keys: JWTVerifyGetKey;
let sign: (claims: Record<string, unknown>, opts?: { iss?: string; aud?: string; exp?: string }) => Promise<string>;

beforeAll(async () => {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256" };
  keys = createLocalJWKSet({ keys: [jwk] });
  sign = (claims, opts = {}) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: "RS256", kid: "k1" })
      .setIssuer(opts.iss ?? GITHUB_OIDC_ISSUER)
      .setAudience(opts.aud ?? OIDC_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(opts.exp ?? "5m")
      .sign(privateKey);
});

const ok = { repository: "tgjarkovsky/guth-pictures", ref: "refs/heads/main" };

describe("GitHub OIDC cron auth", () => {
  it("accepts a token from this repository's main branch", async () => {
    expect(await isGithubActionsToken(await sign(ok), keys)).toBe(true);
  });
  it("rejects other repos, branches, audiences, issuers and expired tokens", async () => {
    expect(await isGithubActionsToken(await sign({ ...ok, repository: "someone/else" }), keys)).toBe(false);
    expect(await isGithubActionsToken(await sign({ ...ok, ref: "refs/heads/feature" }), keys)).toBe(false);
    expect(await isGithubActionsToken(await sign(ok, { aud: "other" }), keys)).toBe(false);
    expect(await isGithubActionsToken(await sign(ok, { iss: "https://evil.example" }), keys)).toBe(false);
    expect(await isGithubActionsToken(await sign(ok, { exp: "-1m" }), keys)).toBe(false);
    expect(await isGithubActionsToken("not.a.jwt", keys)).toBe(false);
  });
  it("still accepts CRON_SECRET and refuses no header", async () => {
    process.env.CRON_SECRET = "secret-value";
    expect(await isAuthorizedCron("Bearer secret-value", keys)).toBe(true);
    expect(await isAuthorizedCron("Bearer wrong", keys)).toBe(false);
    expect(await isAuthorizedCron(null, keys)).toBe(false);
    expect(await isAuthorizedCron(`Bearer ${await sign(ok)}`, keys)).toBe(true);
    delete process.env.CRON_SECRET;
  });
});
