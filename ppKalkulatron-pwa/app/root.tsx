import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
} from "react-router";
import type { ReactNode } from "react";
import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
    },
];

import { useEffect } from "react";
import { ThemeProvider } from "./components/ui/ThemeProvider";
import { YearProvider } from "./contexts/YearContext";

export function Layout({ children }: { children: ReactNode }) {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            const swUrl = import.meta.env.DEV ? "/dev-sw.js?dev-sw" : "/sw.js";
            const swOptions = import.meta.env.DEV ? { type: "module" } : {};

            navigator.serviceWorker
                .register(swUrl, swOptions as any)
                .then((reg) => console.log("SW registered:", reg.scope))
                .catch((err) => console.error("SW registration failed:", err));
        }
    }, []);

    return (
        <html lang="en">
        <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            <meta name="theme-color" content="#0B0B0F" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <link rel="icon" href="/favicon.ico" sizes="any" />
            <link rel="apple-touch-icon" href="/icon-512.png" />
            <link rel="manifest" href="/manifest.webmanifest" />
            {/* Share preview (društvene mreže, link u chatu) – za puni URL u productionu postavi VITE_APP_URL */}
            <meta property="og:type" content="website" />
            <meta property="og:image" content="/icon-512.png" />
            <meta property="og:image:width" content="512" />
            <meta property="og:image:height" content="512" />
            <meta name="twitter:card" content="summary" />
            <meta name="twitter:image" content="/icon-512.png" />
            <Meta />
            <Links />
        </head>
        <body>
        <ThemeProvider>
            <YearProvider>
                {children}
            </YearProvider>
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
        </body>
        </html>
    );
}

export default function App() {
    return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    let message = "Oops!";
    let details = "An unexpected error occurred.";
    let stack: string | undefined;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : "Error";
        details =
            error.status === 404
                ? "The requested page could not be found."
                : error.statusText || details;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main className="pt-16 p-4 container mx-auto">
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
            )}
        </main>
    );
}
