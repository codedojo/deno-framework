import { ServerRequest } from 'https://deno.land/std/http/server.ts';

export { Request as default };

interface Request {
    request: ServerRequest;
    method: string;
    url: string;
    headers?: Headers;
    contentLength: number | null;
    params?: object;
    body?: string | object;
}

const Request = (request: ServerRequest): Request => ({
    request,
    method: request.method,
    url: request.url,
    headers: request.headers,
    contentLength: request.contentLength
});