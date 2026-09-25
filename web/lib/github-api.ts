import { getGithubRepo } from "./repo";

function requireToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required for PORT_DATA_BACKEND=github");
  return token;
}

export async function githubRequest<T>(pathname: string, init: RequestInit = {}): Promise<T> {
  const token = requireToken();
  const response = await fetch(`https://api.github.com${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 400)}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

type GithubContent = {
  content: string;
  sha: string;
  encoding: string;
};

export async function readGithubJsonFile<T>(filePath: string): Promise<{ data: T; sha: string }> {
  const { owner, repo } = getGithubRepo();
  const payload = await githubRequest<GithubContent>(
    `/repos/${owner}/${repo}/contents/${filePath}?ref=${process.env.GITHUB_REF || "main"}`
  );
  const decoded = Buffer.from(payload.content, "base64").toString("utf8");
  return { data: JSON.parse(decoded) as T, sha: payload.sha };
}

export async function writeGithubJsonFile(filePath: string, data: unknown, sha: string, message: string) {
  const { owner, repo } = getGithubRepo();
  const content = Buffer.from(JSON.stringify(data, null, 2) + "\n").toString("base64");
  await githubRequest(`/repos/${owner}/${repo}/contents/${filePath}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content,
      sha,
      branch: process.env.GITHUB_REF || "main"
    })
  });
}

export async function dispatchRadarWorkflow() {
  const { owner, repo } = getGithubRepo();
  const workflowFile = process.env.RADAR_WORKFLOW_FILE || "opportunity-radar.yml";
  await githubRequest(`/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`, {
    method: "POST",
    body: JSON.stringify({ ref: process.env.GITHUB_REF || "main" })
  });
}
