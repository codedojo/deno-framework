import { ServerRequest } from 'https://deno.land/std/http/server.ts';

export { Response as default };

interface Response {
    headers?: Headers;
    status: number;
    send(data: string): Promise<void>;
    json(data: object): Promise<void>;
}

const Response = (request: ServerRequest): Response => ({
    headers: request.headers,
    status: 200,

    send(data: string) {
        return request.respond({
            body: data,
            headers: this.headers,
            status: this.status
        });
    },

    json(data: object) {
        request.headers?.set('Content-Type', 'application/json');

        return request.respond({
            body: JSON.stringify(data),
            headers: this.headers,
            status: this.status
        });
    }
});