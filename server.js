import { Plugin } from "@opencode/plugin"
import { execFile } from "node:child_process"
import { GitHub } from "./rpc.js"

const FIELDS = [
  "nameWithOwner",
  "visibility",
  "url",
  "description",
  "isArchived",
  "primaryLanguage",
  "stargazerCount",
  "forkCount",
  "pushedAt",
  "updatedAt",
  "repositoryTopics",
].join(",")
const LIMIT = "200"

function runGh(bin) {
  return new Promise((resolve, reject) => {
    execFile(
      bin,
      ["repo", "list", "--limit", LIMIT, "--json", FIELDS],
      { encoding: "utf8", timeout: 30000, windowsHide: true, maxBuffer: 16 * 1024 * 1024 },
      (error, stdout) => (error ? reject(error) : resolve(stdout)),
    )
  })
}

async function ghOutput() {
  try {
    return await runGh("gh")
  } catch (error) {
    if (process.platform === "win32" && error && error.code === "ENOENT") {
      return await runGh("C:\\Program Files\\GitHub CLI\\gh.exe")
    }
    throw error
  }
}

function clean(text) {
  return (text || "").replace(/\s+/g, " ").trim()
}

export async function listRepos() {
  const raw = JSON.parse(await ghOutput())

  return raw
    .map((repo) => ({
      name: repo.nameWithOwner.split("/").slice(-1)[0],
      owner: repo.nameWithOwner.split("/")[0],
      visibility: repo.visibility,
      url: repo.url,
      description: clean(repo.description),
      language: repo.primaryLanguage ? repo.primaryLanguage.name : "",
      stars: repo.stargazerCount || 0,
      forks: repo.forkCount || 0,
      archived: Boolean(repo.isArchived),
      pushedAt: repo.pushedAt || "",
      updatedAt: repo.updatedAt || "",
      topics: (repo.repositoryTopics || []).map((topic) => topic.name).slice(0, 8),
    }))
    .sort((a, b) => (b.pushedAt || "").localeCompare(a.pushedAt || ""))
}

export default Plugin.define({
  id: "github-repos-panel",
  async setup(ctx) {
    await ctx.rpc.register(GitHub, {
      repos: async () => ({ items: await listRepos() }),
    })
  },
})
