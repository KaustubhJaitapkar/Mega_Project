export async function checkHealthUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function checkGithubRepo(url: string): Promise<boolean> {
  try {
    // Extract owner and repo from GitHub URL
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return false;

    const [, owner, repo] = match;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {},
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function validateSubmission(
  githubUrl?: string,
  liveUrl?: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  if (!githubUrl && !liveUrl) {
    errors.push('Either GitHub URL or Live URL is required');
  }

  if (githubUrl) {
    const isValidGithub = await checkGithubRepo(githubUrl);
    if (!isValidGithub) {
      errors.push('GitHub repository not found or invalid');
    }
  }

  if (liveUrl) {
    const isHealthy = await checkHealthUrl(liveUrl);
    if (!isHealthy) {
      errors.push('Live URL is not accessible');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
