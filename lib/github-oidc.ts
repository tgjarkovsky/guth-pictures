import "server-only";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

// Lets a GitHub Actions workflow call our cron endpoints without any stored secret:
// the job asks GitHub for a short-lived OIDC token (permissions: id-token: write) and we
// verify its signature and claims. Only workflows on this repository's main branch pass.

export const GITHUB_OIDC_ISSUER = "https://token.actions.githubusercontent.com";
export const OIDC_AUDIENCE = "guthpictures.eu";
const REPOSITORY = "tgjarkovsky/guth-pictures";
const REF = "refs/heads/main";

let remoteJwks: JWTVerifyGetKey | null = null;
const githubJwks = () => (remoteJwks ??= createRemoteJWKSet(new URL(`${GITHUB_OIDC_ISSUER}/.well-known/jwks`)));

export async function isGithubActionsToken(token: string, keys: JWTVerifyGetKey = githubJwks()): Promise<boolean> {
  if (!token || token.split(".").length !== 3) return false;
  try {
    const { payload } = await jwtVerify(token, keys, { issuer: GITHUB_OIDC_ISSUER, audience: OIDC_AUDIENCE, algorithms: ["RS256"] });
    return payload.repository === REPOSITORY && payload.ref === REF;
  } catch {
    return false;
  }
}

/** Cron auth: the CRON_SECRET (Vercel, manual calls) or a GitHub Actions OIDC token. */
export async function isAuthorizedCron(authorization: string | null, keys?: JWTVerifyGetKey): Promise<boolean> {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return false;
  if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) return true;
  return isGithubActionsToken(token, keys);
}
