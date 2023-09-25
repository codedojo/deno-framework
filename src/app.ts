import { listenAndServe } from 'https://deno.land/std/http/server.ts';

import Router, { RequestHandler } from './router.ts';

export { App as default };

interface App {
    use(handler: RequestHandler): App;
    use(path: string, handler: RequestHandler): App;
    get(path: string, handler: RequestHandler): App;
    post(path: string, handler: RequestHandler): App;
    put(path: string, handler: RequestHandler): App;
    patch(path: string, handler: RequestHandler): App;
    delete(path: string, handler: RequestHandler): App;
    listen(options: Deno.ListenOptions): Promise<void>;
}

const App = (): App => {
    const router: Router = Router();

    return {
        use(arg1: string | RequestHandler, arg2?: RequestHandler) {
            router.use(arg1);
            return this;
        },

        get(path, handler) {
            router.get(path, handler);
            return this;
        },

        post(path, handler) {
            router.post(path, handler);
            return this;
        },

        put(path, handler) {
            router.put(path, handler);
            return this;
        },

        patch(path, handler) {
            router.patch(path, handler);
            return this;
        },

        delete(path, handler) {
            router.delete(path, handler);
            return this;
        },

        listen(options) {
            return listenAndServe(options, router.handle);
        }
    };
};