import { Command, MenuItem, Panel, Plugin, Style, usePlugin, type PanelTab } from "@opencode/plugin/gui"
import { createMemo, createSignal, For, Show } from "solid-js"
import { GitHub } from "../rpc.js"

type Repo = {
  name: string
  owner: string
  visibility: string
  url: string
  description: string
  language: string
  stars: number
  forks: number
  archived: boolean
  pushedAt: string
  updatedAt: string
  topics: string[]
}

const TAB: PanelTab = {
  id: "repos",
  title: "GitHub",
  pinned: true,
  fallback: true,
  closable: false,
}

const css = `
.ghr { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; font-size: 12px; height: 100%; overflow: hidden; }
.ghr-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.ghr-title { font-weight: 600; }
.ghr-muted { opacity: .6; font-size: 11px; }
.ghr-filter { width: 100%; box-sizing: border-box; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(127,127,127,.28); background: rgba(127,127,127,.08); color: inherit; font: inherit; outline: none; }
.ghr-filter:focus { border-color: rgba(127,127,127,.55); }
.ghr-list { display: flex; flex-direction: column; gap: 6px; overflow: auto; flex: 1; padding-right: 2px; }
.ghr-item { display: flex; flex-direction: column; gap: 2px; padding: 6px 8px; border-radius: 8px; background: rgba(127,127,127,.06); border: 0; color: inherit; text-align: left; cursor: pointer; font: inherit; }
.ghr-item:hover { background: rgba(127,127,127,.16); }
.ghr-row { display: flex; align-items: center; gap: 6px; min-width: 0; }
.ghr-dot { width: 6px; height: 6px; border-radius: 999px; background: #3fb950; flex: 0 0 auto; }
.ghr-dot.private { background: #d29922; }
.ghr-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
.ghr-badge { font-size: 10px; padding: 0 5px; border-radius: 999px; background: rgba(127,127,127,.18); flex: 0 0 auto; }
.ghr-stars { font-size: 10px; opacity: .75; flex: 0 0 auto; }
.ghr-desc { opacity: .72; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ghr-meta { display: flex; align-items: center; gap: 6px; font-size: 10px; opacity: .55; overflow: hidden; white-space: nowrap; }
.ghr-sep { opacity: .5; }
.ghr-error { color: #f85149; }
.ghr-btn { background: none; border: 0; color: inherit; cursor: pointer; opacity: .6; font: inherit; padding: 0 4px; border-radius: 4px; }
.ghr-btn:hover { opacity: 1; }
`

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function relative(iso: string) {
  if (!iso) return ""
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return ""
  const diff = Date.now() - then
  if (diff < MINUTE) return "just now"
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`
  if (diff < 30 * DAY) return `${Math.floor(diff / DAY)}d ago`
  if (diff < 365 * DAY) return `${Math.floor(diff / (30 * DAY))}mo ago`
  return `${Math.floor(diff / (365 * DAY))}y ago`
}

function RepoList() {
  const ctx = usePlugin()
  const [repos, setRepos] = createSignal<Repo[]>()
  const [failure, setFailure] = createSignal<string>()
  const [query, setQuery] = createSignal("")

  const load = () => {
    setFailure(undefined)
    ctx.client
      .rpc(GitHub)
      .repos({})
      .then((result: { items: Repo[] }) => setRepos(result.items))
      .catch((error: any) => setFailure(String((error && error.message) || error)))
  }

  load()

  const filtered = createMemo(() => {
    const list = repos() || []
    const q = query().trim().toLowerCase()
    if (!q) return list
    return list.filter((repo) =>
      `${repo.name} ${repo.description} ${repo.language} ${repo.topics.join(" ")}`.toLowerCase().includes(q),
    )
  })

  const privateCount = createMemo(() => (repos() || []).filter((repo) => repo.visibility === "PRIVATE").length)

  return (
    <div class="ghr">
      <div class="ghr-head">
        <span class="ghr-title">GitHub repos</span>
        <button class="ghr-btn" title="Refresh" onClick={() => load()}>
          refresh
        </button>
      </div>

      <Show when={repos()}>
        <div class="ghr-muted">
          {(repos() || []).length} repos · {privateCount()} private · by last push
        </div>
        <input
          class="ghr-filter"
          type="search"
          placeholder="Filter repos..."
          value={query()}
          onInput={(event) => setQuery(event.currentTarget.value)}
        />
      </Show>

      <Show when={failure()}>
        <div class="ghr-error">{failure()}</div>
      </Show>

      <Show
        when={repos()}
        fallback={
          <Show when={!failure()}>
            <div class="ghr-muted">Loading...</div>
          </Show>
        }
      >
        <div class="ghr-list">
          <For each={filtered()}>
            {(repo) => (
              <button
                class="ghr-item"
                title={[repo.description, repo.topics.length ? "topics: " + repo.topics.join(", ") : ""].filter(Boolean).join("\n")}
                onClick={() => ctx.system.openExternal(repo.url)}
              >
                <div class="ghr-row">
                  <span class={repo.visibility === "PRIVATE" ? "ghr-dot private" : "ghr-dot"} />
                  <span class="ghr-name">{repo.name}</span>
                  <Show when={repo.archived}>
                    <span class="ghr-badge">archived</span>
                  </Show>
                  <Show when={repo.stars > 0}>
                    <span class="ghr-stars">★ {repo.stars}</span>
                  </Show>
                </div>

                <Show when={repo.description}>
                  <div class="ghr-desc">{repo.description}</div>
                </Show>

                <div class="ghr-meta">
                  <Show when={repo.language}>
                    <span>{repo.language}</span>
                    <span class="ghr-sep">·</span>
                  </Show>
                  <span>{relative(repo.pushedAt) || "no commits"}</span>
                  <Show when={repo.forks > 0}>
                    <span class="ghr-sep">·</span>
                    <span>{repo.forks} forks</span>
                  </Show>
                  <Show when={repo.visibility === "PRIVATE"}>
                    <span class="ghr-sep">·</span>
                    <span>private</span>
                  </Show>
                </div>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}

export default Plugin.define({
  i18n: { en: { title: "GitHub repos" } },
  setup(ctx) {
    ctx.add(Style, css)

    ctx.add(Panel, {
      id: "repos",
      region: "side",
      mobile: { title: "GitHub", order: 50, kind: "menu", icon: "github" },
      list: () => [TAB],
      render: () => <RepoList />,
    })

    const open = () => {
      const session = ctx.sessions.current()
      if (session) ctx.layout.open(ctx.id + ":repos", session)
    }

    ctx.add(
      MenuItem,
      (): MenuItem => ({
        menu: "session.panel",
        id: "repos",
        title: "GitHub repos",
        description: "Your repositories",
        icon: "github",
        order: 20,
        run: open,
      }),
    )

    ctx.add(
      Command,
      (): Command => ({
        id: "open",
        title: "GitHub repos: open panel",
        group: "GitHub",
        bind: "mod+shift+g",
        run: open,
      }),
    )
  },
})
