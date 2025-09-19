import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

interface Env {
  MCP_OBJECT: DurableObjectNamespace;
}

const OSRS_WIKI_API_URL = "https://oldschool.runescape.wiki/api.php";
const USER_AGENT = "osrs-wiki-mcp/2.0 (Cloudflare Workers)";

function buildPageUrl(title: string): string {
  const safe = encodeURIComponent(title.replace(/ /g, "_"));
  return `https://oldschool.runescape.wiki/w/${safe}`;
}

function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]+>/g, "");
}

async function searchWiki(query: string, limit: number = 10): Promise<string> {
  if (!query.trim()) {
    return "❌ Error: query is required";
  }

  limit = Math.min(Math.max(limit, 1), 50);

  const params = new URLSearchParams({
    action: "query",
    format: "json",
    list: "search",
    srsearch: query,
    srlimit: limit.toString(),
  });

  try {
    const response = await fetch(`${OSRS_WIKI_API_URL}?${params}`, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) {
      return `❌ API Error: ${response.status}`;
    }

    const data = (await response.json()) as any;
    const results = data?.query?.search || [];

    if (!results.length) {
      return "🔎 No results found";
    }

    const lines = [
      `📊 Results: ${results.length} (showing up to ${limit})`,
      "",
    ];

    results.forEach((item: any, idx: number) => {
      const title = item.title || "";
      const snippetHtml = item.snippet || "";
      const snippet = stripHtmlTags(snippetHtml).replace(/&quot;/g, '"');
      const url = buildPageUrl(title);

      lines.push(`${idx + 1}. ${title}`);
      if (snippet.trim()) {
        lines.push(`   - ${snippet}`);
      }
      lines.push(`   - ${url}`);
    });

    return lines.join("\n");
  } catch (error) {
    return `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

async function getSummary(title: string): Promise<string> {
  if (!title.trim()) {
    return "❌ Error: title is required";
  }

  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "extracts",
    exintro: "1",
    explaintext: "1",
    formatversion: "2",
    titles: title,
  });

  try {
    const response = await fetch(`${OSRS_WIKI_API_URL}?${params}`, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) {
      return `❌ API Error: ${response.status}`;
    }

    const data = (await response.json()) as any;
    const pages = data?.query?.pages || [];

    if (!pages.length) {
      return "🔎 Page not found";
    }

    const page = pages[0];
    const pageTitle = page.title || title;
    const extract = (page.extract || "").trim();

    if (!extract) {
      return `⚠️ No summary available for '${pageTitle}'`;
    }

    const url = buildPageUrl(pageTitle);
    return `📄 ${pageTitle}\n\n${extract}\n\n🔗 ${url}`;
  } catch (error) {
    return `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

// Define our OSRS Wiki MCP agent with tools
export class OSRSWikiMCP extends McpAgent {
  server = new McpServer({
    name: "osrs-wiki-mcp",
    version: "2.0.0",
  });

  async init() {
    // Search OSRS Wiki tool
    this.server.tool(
      "search",
      {
        query: z.string().describe("Search query"),
        limit: z
          .number()
          .optional()
          .default(10)
          .describe("Number of results to return (1-50)"),
      },
      async ({ query, limit = 10 }) => {
        const result = await searchWiki(query, limit);
        return {
          content: [{ type: "text", text: result }],
        };
      }
    );

    // Get page summary tool
    this.server.tool(
      "summary",
      {
        title: z.string().describe("Page title"),
      },
      async ({ title }) => {
        const result = await getSummary(title);
        return {
          content: [{ type: "text", text: result }],
        };
      }
    );
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/sse")) {
      const handler = OSRSWikiMCP.serveSSE("/sse", { binding: "MCP_OBJECT" });
      return handler.fetch(request, env, ctx);
    }

    if (url.pathname === "/mcp") {
      const handler = OSRSWikiMCP.serve("/mcp", { binding: "MCP_OBJECT" });
      return handler.fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
