// graphify OpenCode plugin
// Injects a knowledge graph reminder before bash tool calls when the graph exists.
import { Plugin } from "@opencode/plugin";
import { existsSync } from "fs";
import { join } from "path";

export default Plugin.define({
  id: "graphify",
  async setup(ctx) {
    const directory = ctx.location.directory;
    let reminded = false;

    await ctx.tool.hook("execute.before", (event) => {
      if (reminded) return;
      if (!existsSync(join(directory, "graphify-out", "graph.json"))) return;

      if (event.tool === "bash") {
        event.input.command =
          'echo "[graphify] Knowledge graph available. Read graphify-out/GRAPH_REPORT.md for god nodes and architecture context before searching files." && ' +
          event.input.command;
        reminded = true;
      }
    });
  },
});
