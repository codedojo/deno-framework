import Request from './request.ts';
import Response from './response.ts';
import { Middleware } from './router.ts';

export async function body(req: Request, res: Response, next: Middleware): Promise<void> {
    if (req.contentLength === null) return;

    const buffer = new Uint8Array(req.contentLength);
    await req.request.body.read(buffer);
    const decoder = new TextDecoder();
    const body = decoder.decode(buffer);
    const isJSON = req.headers?.has('Content-Length');

    req.body = isJSON ? JSON.parse(body) : body;

    next();
}