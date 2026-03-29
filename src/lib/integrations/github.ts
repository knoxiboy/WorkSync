/**
 * GitHub API Client for WorkSync (WorkSyncAI)
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
      console.log(`[GITHUB_FETCH] Fetching PR ${id} for ${owner}/${repo}`);
      const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${id}`, { headers: commonHeaders });
      if (!prRes.ok) {
        console.error(`[GITHUB_FETCH] PR metadata fetch failed: ${prRes.status}`);
        return null;
      }
      const prData = await prRes.json();
      title = prData.title;
      description = prData.body || '';
      diffUrl = prData.diff_url || prData.url;
    } else if (type === 'commit' && id) {
      console.log(`[GITHUB_FETCH] Fetching Commit ${id} for ${owner}/${repo}`);
      const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${id}`, { headers: commonHeaders });
      if (!commitRes.ok) {
        console.error(`[GITHUB_FETCH] Commit metadata fetch failed: ${commitRes.status}`);
        return null;
      }
      const commitData = await commitRes.json();
      title = commitData.commit.message.split('\n')[0];
      description = commitData.commit.message;
      diffUrl = commitData.url;
    } else if (type === 'repo') {
      console.log(`[GITHUB_FETCH] Fetching latest commit for repo ${owner}/${repo}`);
      const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, { headers: commonHeaders });
      if (!commitsRes.ok) {
        console.error(`[GITHUB_FETCH] Repo commits fetch failed: ${commitsRes.status}`);
        return null;
      }
      const commits = await commitsRes.json();
      if (commits.length === 0) return null;
      
      const latestCommit = commits[0];
      title = `Latest work in ${repo}`;
      description = latestCommit.commit.message;
      diffUrl = latestCommit.url;
    } else {
      console.warn(`[GITHUB_FETCH] Unsupported metadata type: ${type}`);
      return null;
    }

    // Fetch actual diff
    const diffRes = await fetch(diffUrl, {
      headers: {
        ...commonHeaders,
        Accept: "application/vnd.github.v3.diff",
      }
    });
    
    if (!diffRes.ok) {
      console.error(`[GITHUB_FETCH] Diff fetch failed from ${diffUrl}: ${diffRes.status}`);
      return null;
    }
    const diff = await diffRes.text();
    console.log(`[GITHUB_FETCH] Successfully fetched diff (${diff.length} bytes)`);

    return { title, description, diff };
  } catch (error) {
    console.error("Error fetching GitHub work", error);
    return null;
  }
}
