import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	define: {
		global: 'globalThis',
	},
	server: {
		watch: {
			usePolling: true,
		},
		host: true,
		allowedHosts: true,
		strictPort: true,
		port: 5173,
		proxy: {
      '/api': {
        target: 'http://app:8080',
        changeOrigin: true,
        secure: false,
      },
      '/oauth2': {
        target: 'http://app:8080',
        changeOrigin: true,
        secure: false,
      },
      '/login/oauth2': {
        target: 'http://app:8080',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'http://app:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    }
	},
});