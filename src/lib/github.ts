/**
 * GitHub API Client for ANTIGRAVITY (WorkSyncAI)
 * Uses the GitHub API to fetch PR/Commit diffs.
 */

import { GitHubMetadata } from "./github-parser";

export interface GitHubWork {
  title: string;
  description: string;
  diff: string;
}

export async function fetchGitHubWork(metadata: GitHubMetadata): Promise<GitHubWork | null> {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  if (!GITHUB_TOKEN) {
    console.error("GITHUB_TOKEN is not configured in .env.local");
    return null;
  }

  const { owner, repo, type, id } = metadata;
  const commonHeaders = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
  };

  try {
    let title = '';
    let description = '';
    let diffUrl = '';

    if (type === 'pr' && id) {
      const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${id}`, { headers: commonHeaders });
      if (!prRes.ok) return null;
      const prData = await prRes.json();
      title = prData.title;
      description = prData.body || '';
      diffUrl = prData.diff_url || prData.url;
    } else if (type === 'commit' && id) {
      const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${id}`, { headers: commonHeaders });
      if (!commitRes.ok) return null;
      const commitData = await commitRes.json();
      title = commitData.commit.message.split('\n')[0];
      description = commitData.commit.message;
      diffUrl = commitData.url;
    } else {
      return null;
    }

    // Fetch actual diff
    const diffRes = await fetch(diffUrl, {
      headers: {
        ...commonHeaders,
        Accept: "application/vnd.github.v3.diff",
      }
    });
    
    if (!diffRes.ok) return null;
    const diff = await diffRes.text();

    return { title, description, diff };
  } catch (error) {
    console.error("Error fetching GitHub work", error);
    return null;
  }
}
