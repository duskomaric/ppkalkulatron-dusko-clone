import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/login.tsx"),
  route("invoices", "routes/invoices.tsx"),
  route("clients", "routes/clients.tsx"),
  route("articles", "routes/articles.tsx"),
] satisfies RouteConfig;
