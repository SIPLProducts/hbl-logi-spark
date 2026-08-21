import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Matches vite.config.ts's `base: "/le/"` — the deployed app is served
    // from http://10.10.4.178/le/, not domain root. import.meta.env.PROD is
    // false in `npm run dev`, so local dev stays at plain http://localhost:PORT/.
    basepath: import.meta.env.PROD ? "/le/" : "/",
  });

  return router;
};
