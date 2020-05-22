import {
  listenAndServe,
  ServerRequest,
} from "https://deno.land/std/http/server.ts";
import {
  match,
  Match,
  MatchFunction,
} from "https://deno.land/x/path_to_regexp/mod.ts";

export { App, Request, body };

type Middleware = (error?: Error) => void;
type RequestHandler = (req: Request, res: Response, next: Middleware) => void;

interface App {
  use(handler: RequestHandler): App;
  get(path: string, handler: RequestHandler): App;
  post(path: string, handler: RequestHandler): App;
  put(path: string, handler: RequestHandler): App;
  patch(path: string, handler: RequestHandler): App;
  delete(path: string, handler: RequestHandler): App;
  listen(options: Deno.ListenOptions): Promise<void>;
}

interface Route {
  path: string;
  handler: RequestHandler;
  match: MatchFunction;
}

interface RouteMap {
  [index: string]: Route[];
  GET: Route[];
  POST: Route[];
  PUT: Route[];
  PATCH: Route[];
  DELETE: Route[];
}

class Request {
  request: ServerRequest;
  method: string;
  url: string;
  contentLength: number | null;
  params: any = {};
  body: string | object | null = null;

  constructor(request: ServerRequest) {
    this.request = request;
    this.method = request.method;
    this.url = request.url;
    this.contentLength = request.contentLength;
  }
}

class Response {
  headers?: Headers;
  status: number = 200;

  constructor(public request: ServerRequest) {}

  send(data: string) {
    return this.request.respond({
      body: data,
      headers: this.headers,
      status: this.status,
    });
  }

  json(data: object) {
    this.headers?.set("Content-Type", "application/json");

    return this.request.respond({
      body: JSON.stringify(data),
      headers: this.headers,
      status: this.status,
    });
  }
}

function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next?: Middleware,
) {
  res.status = 500;
  res.send("Server Error");
}

function notFoundHandler(req: Request, res: Response) {
  res.status = 404;
  res.send("Not Found");
}

async function body(
  req: Request,
  res: Response,
  next: Middleware,
): Promise<void> {
  if (req.contentLength === null) return;

  const buffer = new Uint8Array(req.contentLength);
  await req.request.body.read(buffer);
  const decoder = new TextDecoder();

  req.body = decoder.decode(buffer);

  next();
}

const App = (): App => {
  const middleware: Route[] = [];
  const routes: RouteMap = {
    GET: [],
    POST: [],
    PUT: [],
    PATCH: [],
    DELETE: [],
  };

  async function handleRequest(request: ServerRequest) {
    const req = new Request(request);
    const res = new Response(request);
    const stack = [...middleware, ...routes[request.method]];

    function next(error?: Error): void {
      if (error) return errorHandler(error, req, res);

      const route = stack.shift();

      if (!route) return notFoundHandler(req, res);

      const match: Match = route.match(req.url);

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

  function use(fn: RequestHandler): App;
  function use(path: string, fn: RequestHandler): App;
  function use(
    this: App,
    arg1: string | RequestHandler,
    arg2?: RequestHandler,
  ): App {
    const { path, handler } = arg2 === undefined
      ? {
        path: "/",
        handler: arg1 as RequestHandler,
      }
      : {
        path: arg1 as string,
        handler: arg2 as RequestHandler,
      };

    middleware.push({ path, handler, match: match(path) });

    return this;
  }

  return {
    use,

    get(path: string, handler: RequestHandler): App {
      routes.GET.push({ path, handler, match: match(path) });
      return this;
    },

    post(path: string, handler: RequestHandler) {
      routes.POST.push({ path, handler, match: match(path) });
      return this;
    },

    put(path: string, handler: RequestHandler) {
      routes.PUT.push({ path, handler, match: match(path) });
      return this;
    },

    patch(path: string, handler: RequestHandler) {
      routes.PATCH.push({ path, handler, match: match(path) });
      return this;
    },

    delete(path: string, handler: RequestHandler) {
      routes.DELETE.push({ path, handler, match: match(path) });
      return this;
    },

    listen(options: Deno.ListenOptions) {
      return listenAndServe(options, handleRequest);
    },
  };
};
