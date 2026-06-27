import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	base: "/",
	build: {
		outDir: "../elif-nur-worker/public",
		emptyOutDir: false,
		assetsDir: "assets",
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
				admin: resolve(__dirname, "admin/index.html"),
				contact: resolve(__dirname, "contact/index.html"),
				privacy: resolve(__dirname, "privacy/index.html"),
				about: resolve(__dirname, "about/index.html"),
			},
		},
	},
});
