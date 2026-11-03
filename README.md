# opencode-github-repos-panel

A GitHub repositories panel for **OpenCode Desktop**. It puts your repos in a
dedicated sidebar tab instead of a chat tool result, with the details that
actually tell you where you left off: last push, primary language, stars,
forks, topics and archived state.

```
GitHub repos                    refresh
60 repos · 44 private · by last push
[ filter repos...                    ]

● tomekdot.github.io            ★ 1
  tomekdot's plugins and projects
  TypeScript · 2m ago
```

Repos are sorted by last push (newest first), so the top of the list is where
the recent work is. Clicking a row opens the repository on GitHub. A filter box
matches on name, description, language and topics.

## Features

- Sidebar panel (`GitHub` tab) pinned and opened by default on the side region.
- Session panel menu entry plus the `mod+shift+g` shortcut.
- Relative "last push" timestamps, so a repo pushed today is obvious at a glance.
- Private/public dots, stars, forks, archived badges, languages, topics.
- Filter input, refresh button, graceful error message when `gh` is missing.
- Works offline against the GitHub CLI cache: one `gh repo list` call per
  refresh, no per-repo API requests.

## Requirements

- OpenCode **2.2+** (Desktop build, which loads `gui-experimental` bundles).
- [GitHub CLI](https://cli.github.com/) installed and authenticated:

  ```sh
  gh auth status
  ```

  The panel runs `gh repo list --limit 200`, so it only sees repos the logged-in
  account can access.

## Install

Clone it next to your OpenCode config and install the dev dependencies:

```sh
git clone https://github.com/tomekdot/opencode-github-repos-panel.git \
  ~/.config/opencode/github-repos-panel
cd ~/.config/opencode/github-repos-panel && npm install
```

Register the plugin in `~/.config/opencode/opencode.jsonc`:

```jsonc
{
  "plugins": ["./github-repos-panel"]
}
```

Restart OpenCode Desktop. The panel is a side tab; if it is not visible, open the
session panel menu and pick **GitHub repos**, or press `mod+shift+g`.

`gui-experimental.cjs` is committed prebuilt, so a plain checkout works without
running the bundler. Re-run `npm run build` only when you change `src/gui.tsx`.

## How it works

The plugin has two halves, wired together over OpenCode's RPC layer:

| Part | File | Role |
| --- | --- | --- |
| Server | `server.js` | Runs `gh repo list --json …`, normalizes the output, registers the `repos` RPC method. |
| Contract | `rpc.js` | Shared `Rpc.define({ id: "github-repos", methods: { repos } })` schema, used by both sides. |
| GUI | `src/gui.tsx` | Panel, menu item, command and list rendering. Built into `gui-experimental.cjs`. |

The renderer has no Node access, so it never shells out: it asks the server part
for data with `ctx.client.rpc(GitHub).repos({})`.

Fields returned per repo: `name`, `owner`, `visibility`, `url`, `description`,
`language`, `stars`, `forks`, `archived`, `pushedAt`, `updatedAt`, `topics`.

## Development

```sh
npm install
npm run build      # vite → gui-experimental.cjs
npm run check      # RPC smoke test against the running OpenCode service
```

`npm run check` reads the service URL and password from
`~/.local/state/opencode/service.json`; override with `OPENCODE_URL` and
`OPENCODE_PASSWORD`.

Layout:

```
server.js             server plugin: gh query + RPC registration
rpc.js                RPC contract shared by server and GUI
src/gui.tsx           panel, menu item, command, styles
vite.config.ts        gui preset build → gui-experimental.cjs
scripts/check-rpc.mjs live RPC smoke test
```

## License

MIT
