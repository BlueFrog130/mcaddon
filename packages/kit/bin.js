import fs from 'fs';
import path from 'path';
import sade from 'sade';
import { gtBuild as build, zip } from './index.js';

const { version, name } = JSON.parse(
	fs.readFileSync(path.join(process.cwd(), './package.json'), 'utf-8')
);

const prog = sade('gametest-kit').version(version);

prog
	.command('build')
	.describe('Builds and copies development/resource pack to Minecraft.')
	.option('-m, --minify', 'Minifies output')
	.option('-w, --watch', 'Watches for changes')
	.action(async ({ watch, minify }) => {
		console.log('building...');
		await build({
			watch,
			minify,
			cwd: process.cwd(),
			name,
			copy: true,
		});
	});

prog
	.command('package')
	.describe('Builds and bundles development/resource pack')
	.option('-m, --minify', 'Minifies output')
	.action(async ({ minify }) => {
		await build({
			watch: false,
			minify,
			cwd: process.cwd(),
			name,
			copy: false,
		});

		await zip(process.cwd(), name);
	});

prog.parse(process.argv);
