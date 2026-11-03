import { readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { OpenCode } from "@opencode/client"
import { GitHub } from "../rpc.js"

// Address and password of the locally running OpenCode service.
// Override with OPENCODE_URL / OPENCODE_PASSWORD, otherwise read service.json.
function service() {
  const override = {
    url: process.env.OPENCODE_URL,
    password: process.env.OPENCODE_PASSWORD,
  }
  if (override.url && override.password) return override

  const file = join(homedir(), ".local", "state", "opencode", "service.json")
  const raw = JSON.parse(readFileSync(file, "utf8"))
  return { url: override.url || raw.url, password: override.password || raw.password }
}

const { url, password } = service()

const client = OpenCode.make({
  baseUrl: url,
  headers: { authorization: "Basic " + Buffer.from("opencode:" + password).toString("base64") },
})

const result = await client.rpc(GitHub).repos({})
console.log("OK items:", result.items.length)
console.log(result.items.slice(0, 3))
