import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
	test: {
		setupFiles: ["./test/apply-migrations.ts"],
		poolOptions: {
			workers: {
				wrangler: { configPath: "./wrangler.jsonc" },
				miniflare: {
					bindings: {
						ADMIN_API_KEY: "test-admin-key-for-ci-only-32chars",
					},
				},
			},
		},
	},
});
