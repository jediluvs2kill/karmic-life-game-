# Jev NPC decisions

Karmic Life can use Jev as a fast, typed decision layer for its 24 fictional residents. Jev chooses a bounded action such as building, gardening, playing, greeting, inspecting, or resting. The game still owns movement, collision, animation, dialogue snippets, and truth-state records. NPC animation never creates evidence or project progress.

Without credentials the local server uses deterministic role-based decisions, so the world remains populated and testable. The Agent HQ badge reads **JEV LIVE** only when the most recent decision batch came from Jev.

## Cloudflare Workers AI

Set these environment variables before starting the development server:

```text
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-workers-ai-token
```

The server calls the `typesafe/jev` model and keeps both values on the server. See the [Cloudflare Jev model documentation](https://developers.cloudflare.com/ai/models/typesafe/jev/) for account and model availability.

## Direct Jev endpoint

For a compatible hosted endpoint, set:

```text
JEV_API_URL=https://your-endpoint.example/v1/decision
JEV_API_KEY=your-key
JEV_MODEL=jev-latest
```

`JEV_MODEL` is optional. Restart `npm run dev` after changing environment variables. Never place credentials in browser code, committed files, world events, or contribution footprints.
