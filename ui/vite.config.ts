import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		watch: {
			usePolling: true,
		},
		host: true,
		allowedHost: true,
		strictPort: true,
		port: 5173,
		proxy: {
      // 🚀 THE MAGIC: Tell Vite to forward all /api requests to Spring Boot!
      '/api': {
        target: 'http://app:8080',
        changeOrigin: true,
        secure: false,
      }
    }
	},
});