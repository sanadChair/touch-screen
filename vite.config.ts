import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	plugins: [preact(), tailwindcss()],
	resolve: {
		alias: {
			react: "preact/compat",
			"react-dom/test-utils": "preact/test-utils",
			"react-dom": "preact/compat",
			"react/jsx-runtime": "preact/jsx-runtime",
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
