import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Authless Calculator",
		version: "1.0.0",
	});

	async init() {
		this.server.registerTool('get_client_capabilities', {
			title: "Get client capabilities",
			description: "Get the client capabilities",
		}, async () => {
			const capabilities = this.server.server.getClientCapabilities()
			if (!capabilities) {
				return { content: [{ type: "text", text: 'No capabilities' }] }
			}
			return { content: [{ type: "text", text: JSON.stringify(capabilities, null, 2) }] }
		})

		this.server.registerTool('ask_for_poem', {
			title: "Ask for poem",
			description: "Ask for a poem",
		}, async () => {
			const capabilities = this.server.server.getClientCapabilities()
			if (!capabilities?.sampling) {
				return { content: [{ type: "text", text: "You do not support sampling" }] }
			}

			console.log('Starting sampling')

			const result = await this.server.server.createMessage({
				systemPrompt: `You are good at poetry and really like dogs`,
				messages: [
					{
						role: 'user',
						content: {
							type: 'text',
							text: 'Please write me a poem',
						},
					},
				],
				maxTokens: 100,
			})

			return { content: [result.content] }
		})

		this.server.registerTool('elicit_feedback', {
			title: "Elicit feedback",
			description: "Elicit feedback from the user",
		}, async () => {

			const capabilities = this.server.server.getClientCapabilities()
			if (!capabilities?.elicitation) {
				return { content: [{ type: "text", text: "You do not support elicitation" }] }
			}

			console.log('Starting elicitation')

			const result = await this.server.server.elicitInput({
				message: 'Do you like cheese?',
				requestedSchema: {
					type: 'object',
					properties: {
						like_cheese: {
							type: 'boolean',
							description: 'Whether you like cheese',
						},
					},
				},
			})

			if (result.action !== 'accept') {
				return {
					content: [{ type: "text", text: "You didn't respond" }]
				}
			}

			return { content: [{ type: "text", text: result.content?.like_cheese ? "You like cheese" : 'You do not like cheese' }] }
		})

		this.server.registerTool('elicit_feedback_cloudflare', {
			title: "Elicit feedback",
			description: "Elicit feedback from the user",
		}, async () => {

			const capabilities = this.server.server.getClientCapabilities()
			if (!capabilities?.elicitation) {
				return { content: [{ type: "text", text: "You do not support elicitation" }] }
			}

			console.log('Starting elicitation')

			const result = await this.elicitInput({
				message: 'Do you like cheese?',
				requestedSchema: {
					type: 'object',
					properties: {
						like_cheese: {
							type: 'boolean',
							description: 'Whether you like cheese',
						},
					},
				},
			})

			if (result.action !== 'accept') {
				return {
					content: [{ type: "text", text: "You didn't respond" }]
				}
			}

			return { content: [{ type: "text", text: result.content?.like_cheese ? "You like cheese" : 'You do not like cheese' }] }
		})

		// Simple addition tool
		this.server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
			content: [{ type: "text", text: String(a + b) }],
		}));

		// Calculator tool with multiple operations
		this.server.tool(
			"calculate",
			{
				operation: z.enum(["add", "subtract", "multiply", "divide"]),
				a: z.number(),
				b: z.number(),
			},
			async ({ operation, a, b }) => {
				let result: number;
				switch (operation) {
					case "add":
						result = a + b;
						break;
					case "subtract":
						result = a - b;
						break;
					case "multiply":
						result = a * b;
						break;
					case "divide":
						if (b === 0)
							return {
								content: [
									{
										type: "text",
										text: "Error: Cannot divide by zero",
									},
								],
							};
						result = a / b;
						break;
				}
				return { content: [{ type: "text", text: String(result) }] };
			},
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
