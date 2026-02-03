import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
    server: {
        // Add the specific ngrok hostname to the allowed list
        allowedHosts: ['65bf05d20cc6.ngrok-free.app', 'localhost', '127.0.0.1'],
    },
});
