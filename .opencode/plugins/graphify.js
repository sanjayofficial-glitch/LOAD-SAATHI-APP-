// graphify OpenCode plugin
// Injects a knowledge-graph reminder before the first bash call of a session
// when graphify-out/graph.json exists.
// Ported to the current @opencode-ai/plugin API (plain function + hooks object;
// the old Plugin.define({ tool.hook }) API does not exist in v1.18.32).
import { existsSync } from "fs";
import { join } from "path";

let reminded = false;

export const GraphifyPlugin = async ({ directory }) => {
  // Reset once-per-session behavior at plugin setup (new session -> fresh flag).
  reminded = false;

  return {
    "tool.execute.before": async (input, output) => {
      if (reminded) return;
      if (!input || input.tool !== "bash") return;
      if (!output || !output.args || typeof output.args.command !== "string") return;
      if (!existsSync(join(directory, "graphify-out", "graph.json"))) return;

      output.args.command =
        'echo "[graphify] Code memory available. graphify-out/GRAPH_REPORT.md (god nodes + communities), graphify-out/graph.html (interactive map), .memory/ (curated project facts). Ask the graph: graphify query \\"<question>\\"" && ' +
        output.args.command;
      reminded = true;
    },
  };
};

export default GraphifyPlugin;
