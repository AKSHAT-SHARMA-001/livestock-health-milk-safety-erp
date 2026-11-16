import { defineConfig } from "vite";

const ports = { user: 8081, vet: 8082, pharmacy: 8083, milk: 8084 };
const proxy = Object.fromEntries(
  Object.entries(ports).map(([service, port]) => [
    "/backend/" + service,
    {
      target: "http://127.0.0.1:" + port,
      changeOrigin: true,
      rewrite: (path) => path.replace("/backend/" + service, ""),
      configure(server) {
        server.on("proxyReq", (request) =>
          request.setHeader("Origin", "http://localhost:5173"),
        );
      },
    },
  ]),
);
export default defineConfig({
  server: {
    host: "127.0.0.1",
    allowedHosts: [
      ".trycloudflare.com",
      ".loca.lt",
      ".lhr.life",
      ".localhost.run",
      ".pinggy-free.link",
      ".pinggy.net",
    ],
    proxy,
  },
});
