import path from "node:path";

export function getRepoRoot(): string {
  return process.env.PORT_REPO_ROOT || path.join(process.cwd(), "..");
}

export function getDataBackend(): "local" | "github" {
  if (process.env.PORT_DATA_BACKEND === "github") return "github";
  if (process.env.PORT_DATA_BACKEND === "local") return "local";
  // Vercel has no persistent repo filesystem; use GitHub API for read/write.
  if (process.env.VERCEL) return "github";
  return "local";
}

export function assertDataBackendConfigured() {
  if (getDataBackend() !== "github") return;
  if (!process.env.GITHUB_TOKEN) {
    throw new Error(
      "Vercel deployment requires GITHUB_TOKEN (repo contents + Actions write) and PORT_DATA_BACKEND=github."
    );
  }
}

export function getGithubRepo(): { owner: string; repo: string } {
  const slug = process.env.GITHUB_REPOSITORY || "Ian9Franco/Port";
  const [owner, repo] = slug.split("/");
  if (!owner || !repo) throw new Error("Invalid GITHUB_REPOSITORY");
  return { owner, repo };
}
