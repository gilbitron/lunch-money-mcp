import "dotenv/config";
import { FastMCP } from "fastmcp";
import { LunchMoneyClient } from "./api/client.js";
import { registerUserTools } from "./tools/user.js";
import { registerCategoryTools } from "./tools/categories.js";
import { registerTagTools } from "./tools/tags.js";
import { registerTransactionTools } from "./tools/transactions.js";
import { registerRecurringTools } from "./tools/recurring.js";
import { registerBudgetTools } from "./tools/budgets.js";
import { registerAssetTools } from "./tools/assets.js";
import { registerPlaidTools } from "./tools/plaid.js";

// Load environment variables
const apiToken = process.env.LUNCH_MONEY_API_TOKEN;
const host = process.env.HOST || "0.0.0.0";
const port = parseInt(process.env.PORT || "8080", 10);
const serverApiKey = process.env.SERVER_API_KEY;

if (!apiToken) {
    console.error(
        "Error: LUNCH_MONEY_API_TOKEN environment variable is required"
    );
    console.error(
        "Please set it in your .env file or as an environment variable"
    );
    process.exit(1);
}

// Initialize API client
const client = new LunchMoneyClient(apiToken);

// Create FastMCP server instance with authentication
const serverOptions: ConstructorParameters<typeof FastMCP>[0] = {
    name: "Lunch Money MCP",
    version: "1.0.0",
    instructions:
        "This MCP server provides full integration with the Lunch Money API. " +
        "You can manage user accounts, categories, tags, transactions, recurring items, budgets, and assets. " +
        "All operations support full CRUD capabilities with proper validation.",
    health: {
        enabled: true,
    },
};

// Add authentication if SERVER_API_KEY is set
if (serverApiKey) {
    serverOptions.authenticate = async (request) => {
        // Allow /ready endpoint without authentication (FastMCP's built-in health check)
        const url = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
        if (url.pathname === "/ready" && request.method === "GET") {
            return { authenticated: false };
        }

        // FastMCP's request.headers can be a Headers object or a plain object
        const authHeader = request.headers instanceof Headers
            ? request.headers.get("authorization")
            : (request.headers["authorization"] || request.headers["Authorization"]);

        if (!authHeader) {
            throw new Response(
                JSON.stringify({ error: "Unauthorized: Missing Authorization header" }),
                {
                    status: 401,
                    statusText: "Unauthorized",
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Handle both string and string[] types
        const authValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;

        // Support both "Bearer <key>" and direct key formats
        const providedKey = authValue.startsWith("Bearer ")
            ? authValue.substring(7)
            : authValue;

        if (providedKey !== serverApiKey) {
            throw new Response(
                JSON.stringify({ error: "Unauthorized: Invalid API key" }),
                {
                    status: 401,
                    statusText: "Unauthorized",
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Return authentication context (accessible via context.session)
        return {
            authenticated: true,
            apiKey: providedKey,
        };
    };
}

const mcpServer = new FastMCP(serverOptions);

// Register all tool modules
registerUserTools(mcpServer, client);
registerCategoryTools(mcpServer, client);
registerTagTools(mcpServer, client);
registerTransactionTools(mcpServer, client);
registerRecurringTools(mcpServer, client);
registerBudgetTools(mcpServer, client);
registerAssetTools(mcpServer, client);
registerPlaidTools(mcpServer, client);

// Start FastMCP server
mcpServer.start({
    transportType: "httpStream",
    httpStream: {
        host,
        port,
        endpoint: "/mcp",
    },
});

console.log(`Lunch Money MCP Server started on port ${port}`);
console.log(`Server ready to accept connections at http://${host}:${port}/mcp`);
console.log(`Health check available at http://${host}:${port}/health`);
if (serverApiKey) {
    console.log("API key authentication enabled");
} else {
    console.log("Warning: API key authentication is disabled (SERVER_API_KEY not set)");
}
