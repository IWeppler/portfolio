import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasMcpToken } from "@/lib/content/mcp-auth";
import { CONTENT_INSTRUCTIONS, CONTENT_TOOLS } from "@/lib/content/mcp-tools";

// Servidor MCP del modulo Content, por Streamable HTTP sin estado: cada POST
// trae uno o varios mensajes JSON-RPC y se responde con JSON. Alcanza para
// Claude Code (`claude mcp add --transport http ...`), que solo usa tools.
export const runtime = "nodejs";
export const maxDuration = 60;

const SUPPORTED_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

type JsonRpcMessage = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

const result = (id: JsonRpcMessage["id"], value: unknown) => ({ jsonrpc: "2.0", id, result: value });
const failure = (id: JsonRpcMessage["id"], code: number, message: string) => ({
  jsonrpc: "2.0",
  id: id ?? null,
  error: { code, message },
});

async function handle(message: JsonRpcMessage) {
  const { id, method, params } = message;

  switch (method) {
    case "initialize": {
      const requested = String(params?.protocolVersion ?? "");
      return result(id, {
        protocolVersion: SUPPORTED_VERSIONS.includes(requested) ? requested : SUPPORTED_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "portfolio-content", version: "1.0.0" },
        instructions: CONTENT_INSTRUCTIONS,
      });
    }
    case "ping":
      return result(id, {});
    case "tools/list":
      return result(id, {
        tools: CONTENT_TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
      });
    case "tools/call": {
      const tool = CONTENT_TOOLS.find((candidate) => candidate.name === params?.name);
      if (!tool) return failure(id, -32602, `Herramienta desconocida: ${String(params?.name)}`);

      try {
        return result(id, { content: await tool.call(params?.arguments) });
      } catch (error) {
        // Los errores de la herramienta van como resultado para que el modelo los lea y corrija.
        const text =
          error instanceof z.ZodError
            ? `Argumentos invalidos:\n${z.prettifyError(error)}`
            : error instanceof Error
              ? error.message
              : "Error desconocido";
        console.error(`mcp: ${tool.name} failed`, error);
        return result(id, { content: [{ type: "text", text }], isError: true });
      }
    }
    default:
      return failure(id, -32601, `Metodo no soportado: ${method}`);
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.CONTENT_MCP_TOKEN) {
    return NextResponse.json(failure(null, -32000, "CONTENT_MCP_TOKEN no configurado"), { status: 503 });
  }
  if (!hasMcpToken(request)) {
    return NextResponse.json(failure(null, -32001, "unauthorized"), { status: 401 });
  }

  let payload: JsonRpcMessage | JsonRpcMessage[];
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(failure(null, -32700, "JSON invalido"), { status: 400 });
  }

  const messages = Array.isArray(payload) ? payload : [payload];
  // Notificaciones y respuestas (sin method o sin id) no llevan respuesta.
  const requests = messages.filter((message) => message.method && message.id !== undefined);
  const responses = await Promise.all(requests.map(handle));

  if (responses.length === 0) return new Response(null, { status: 202 });

  return NextResponse.json(Array.isArray(payload) ? responses : responses[0]);
}

// Sin stream de servidor a cliente: el cliente ve 405 y sigue solo con POST.
export function GET() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}

export function DELETE() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
