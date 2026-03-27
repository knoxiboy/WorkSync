/**
 * GitHub URL Parser Utility
 * Designed for ANTIGRAVITY (WorkSyncAI)
 */

export interface GitHubMetadata {
  owner: string;
  repo: string;
  type: 'pr' | 'commit' | 'repo';
  id?: string; // PR number or Commit SHA
}

export function parseGitHubUrl(url: string): GitHubMetadata | null {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname !== 'github.com') return null;

    const paths = parsedUrl.pathname.split('/').filter(Boolean);
    if (paths.length < 2) return null;

    const [owner, repo, subType, id] = paths;

    // Handle PRs: /owner/repo/pull/123
    if (subType === 'pull' && id) {
      return { owner, repo, type: 'pr', id };
    }

    // Handle Commits: /owner/repo/commit/sha
    if (subType === 'commit' && id) {
      return { owner, repo, type: 'commit', id };
    }

    // Default to Repo: /owner/repo
    return { owner, repo, type: 'repo' };
  } catch (e) {
    return null;
  }
}
