import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
	entry: ['src/index.ts'],
	format: ['esm'],
	target: 'node18',
	sourcemap: true,
	clean: true,
	dts: false,
	splitting: false,
	treeshake: false,
	outDir: 'dist',
	minify: false,
	swc: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		logger: (options as any).logger,
		jsc: {
			target: 'es2022',
			parser: {
				syntax: 'typescript',
				decorators: true,
			},
			transform: {
				decoratorMetadata: true,
			},
		},
	},
}));
