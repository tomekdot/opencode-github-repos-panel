import { Rpc } from "@opencode/plugin/rpc"

export const GitHub = Rpc.define({
  id: "github-repos",
  methods: {
    repos: {
      input: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      output: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                owner: { type: "string" },
                visibility: { type: "string" },
                url: { type: "string" },
                description: { type: "string" },
                language: { type: "string" },
                stars: { type: "number" },
                forks: { type: "number" },
                archived: { type: "boolean" },
                pushedAt: { type: "string" },
                updatedAt: { type: "string" },
                topics: { type: "array", items: { type: "string" } },
              },
              required: [
                "name",
                "owner",
                "visibility",
                "url",
                "description",
                "language",
                "stars",
                "forks",
                "archived",
                "pushedAt",
                "updatedAt",
                "topics",
              ],
              additionalProperties: false,
            },
          },
        },
        required: ["items"],
        additionalProperties: false,
      },
    },
  },
  events: {},
})
