import { ServerRequest } from 'https://deno.land/std/http/server.ts';
import { match, MatchFunction } from 'https://deno.land/x/path_to_regexp/mod.ts';

import Request from './request.ts';
import Response from './response.ts';

export { Router as default, Middleware, RequestHandler };

type Middleware = (error?: Error) => void;
type RequestHandler = (req: Request, res: Response, next: Middleware) => void;

interface Route {
    path: string;
    handler: RequestHandler;
    match: MatchFunction;
}

interface RouteMap {
    [index: string]: Route[];
    get: Route[];
    post: Route[];
    put: Route[];
    patch: Route[];
    delete: Route[];
}

interface Router {
    middleware: Route[],
    routes: RouteMap;
    use(handler: RequestHandler): Router;
    use(path: string, handler: RequestHandler): Router;
    get(path: string, handler: RequestHandler): Router;
    post(path: string, handler: RequestHandler): Router;
    put(path: string, handler: RequestHandler): Router;
    patch(path: string, handler: RequestHandler): Router;
    delete(path: string, handler: RequestHandler): Router;
    handle(request: ServerRequest): void;
}

const Router = (): Router => ({
    middleware: [],
    routes: {
        get: [],
        post: [],
        put: [],
        patch: [],
        delete: []
    },

    use(arg1: string | RequestHandler, arg2?: RequestHandler) {
        const { path, handler } = arg2 === undefined ?
            {
                path: '/',
                handler: arg1 as RequestHandler
            } : {
                path: arg1 as string,
                handler: arg2 as RequestHandler
            };

        this.middleware.push({ path, handler, match: match(path) });

        return this;
    },

    get(path, handler) {
        this.routes.GET.push({ path, handler, match: match(path) });
        return this;
    },

    post(path, handler) {
        this.routes.POST.push({ path, handler, match: match(path) });
        return this;
    },

    put(path, handler) {
        this.routes.PUT.push({ path, handler, match: match(path) });
        return this;
    },

    patch(path, handler) {
        this.routes.PATCH.push({ path, handler, match: match(path) });
        return this;
    },

    delete(path, handler) {
        this.routes.DELETE.push({ path, handler, match: match(path) });
        return this;
    },

    handle(request) {
        const method = request.method.toLowerCase();
        const req = Request(request);
        const res = Response(request);
        const stack = [...this.middleware, ...this.routes[method]];

        function next(error?: Error): void {
            if (error) return errorHandler(error, req, res);

            const route = stack.shift();

            if (!route) return notFoundHandler(req, res);

            const match = route.match(req.url);

            if (!match) return next(error);

            try {
                req.params = match.params;
                route.handler(req, res, next);
            } catch (error) {
                errorHandler(error, req, res);
            }
        }

        next();
    }
});

function errorHandler(error: Error, req: Request, res: Response, next?: Middleware) {
    res.status = 500;
    res.send('Server Error');
}

function notFoundHandler(req: Request, res: Response) {
    res.status = 404;
    res.send('Not Found');
}