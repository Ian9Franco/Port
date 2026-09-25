import path from "node:path";

export function getRepoRoot(): string {
  return process.env.PORT_REPO_ROOT || path.join(process.cwd(), "..");
}

export function getDataBackend(): "local" | "github" {
  return process.env.PORT_DATA_BACKEND === "github" ? "github" : "local";
}

export function getGithubRepo(): { owner: string; repo: string } {
  const slug = process.env.GITHUB_REPOSITORY || "Ian9Franco/Port";
  const [owner, repo] = slug.split("/");
  if (!owner || !repo) throw new Error("Invalid GITHUB_REPOSITORY");
  return { owner, repo };
}
