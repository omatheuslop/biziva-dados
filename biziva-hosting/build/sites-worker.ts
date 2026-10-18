import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";
import { assist } from "../lib/biziva-gateway.mjs";

export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    const path = new URL(request.url).pathname;
    if (path === '/api/assist') return assist(request);
    if (path !== '/conta' && !path.startsWith('/_vinext') && !path.startsWith('/_next')) {
      return serveEditor(request, env);
    }
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
  },
};

async function serveEditor(request: Request, env: Cloudflare.Env) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Método não permitido', {status:405});
  const assets = (env as unknown as {ASSETS: Fetcher}).ASSETS;
  const url = new URL(request.url);
  const asset = await assets.fetch(request);
  if (asset.status !== 404 && url.pathname !== '/') return asset;
  if (/\.[a-z0-9]+$/i.test(url.pathname)) return asset;
  url.pathname = '/native-index.html'; url.search = '';
  return assets.fetch(new Request(url, request));
}
