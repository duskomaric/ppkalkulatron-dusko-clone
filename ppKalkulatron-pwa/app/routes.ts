import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/login.tsx"),
  route("invoices", "routes/invoices.tsx"),
  route("proformas", "routes/proformas.tsx"),
  route("quotes", "routes/quotes.tsx"),
  route("clients", "routes/clients.tsx"),
  route("articles", "routes/articles.tsx"),
  route("profile", "routes/profile.tsx"),
  route("protocol", "routes/protocol.tsx"),
  route("help", "routes/help.tsx"),
  // Settings Routes
  route("settings/company", "routes/settings/company.tsx"),
  route("settings/general", "routes/settings/general.tsx"),
  route("settings/bank-accounts", "routes/settings/bank-accounts.tsx"),
  route("settings/currencies", "routes/settings/currencies.tsx"),
  route("settings/fiscal", "routes/settings/fiscal.tsx"),
] satisfies RouteConfig;
