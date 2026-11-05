// Fish Audio TTS — entrypoint. The request pipeline (kill switch, Clerk-JWT
// auth, rate limit, strict validation, upstream Fish Audio call with the free
// model) lives in handler.ts, exported as handleTts with injectable
// dependencies so tests can exercise it network-free. This entrypoint keeps
// the deployment contract: Deno.serve registers exactly that handler.
import { handleTts } from "./handler.ts";

Deno.serve((req: Request): Promise<Response> => handleTts(req));
