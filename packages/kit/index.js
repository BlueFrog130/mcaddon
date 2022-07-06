#!/usr/bin/env node
import { build } from 'esbuild';
import { existsSync, createWriteStream } from 'fs';
import { rm } from 'fs/promises';
import { copy } from './util.js';
import { basename, resolve } from 'path';
import { bold, red, green, blue, cyan } from 'kleur/colors';
import { arch, homedir } from 'os';
import chokidar from 'chokidar';
import archiver from 'archiver';

const minecraftDir =
	homedir() +
	'/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/';

const mckit = {
	base: '.mckit',
	get resources() {
		return resolve(this.base, 'resources');
	},
	get behaviors() {
		return resolve(this.base, 'behaviors');
	},
	get scripts() {
		return resolve(this.base, 'scripts');
	},
};

/**
 * @param {string} cwd
 * @param {string} outdir
 * @param {string} name
 * @param {boolean} shouldCopy
 */
export async function copyToMinecraft(cwd, outdir, name, shouldCopy) {
	const resources = resolve(cwd, 'resources');
	const behaviors = resolve(cwd, 'behaviors');
	const scripts = resolve(cwd, mckit.scripts);

	const resourcesOut = resolve(cwd, mckit.resources);
	const behaviorsOut = resolve(cwd, mckit.behaviors);

	// moving resources
	if (existsSync(resources)) {
		copy(resources, resourcesOut);

		if (shouldCopy) {
			const minecraftResourceDir = resolve(
				minecraftDir,
				'development_resource_packs',
				`${name} - resources`
			);

			await rm(minecraftResourceDir, { recursive: true, force: true });
			copy(resourcesOut, minecraftResourceDir);
		}
	}

	// moving behaviors
	if (existsSync(behaviors)) {
		copy(behaviors, behaviorsOut);

		// copying scripts into behaviors
		if (existsSync(scripts)) {
			copy(scripts, resolve(behaviorsOut, 'scripts'));

			if (shouldCopy) {
				const minecraftBehaviorDir = resolve(
					minecraftDir,
					'development_behavior_packs',
					`${name} - behaviors`
				);

				await rm(minecraftBehaviorDir, { recursive: true, force: true });
				copy(behaviorsOut, minecraftBehaviorDir);
			}
		}
	}

	if (shouldCopy) {
		console.log(bold(green('Copy Successful')));
	}
}

/**
 * @param {{ watch: boolean, minify: boolean, cwd: string, name: string, copy: boolean }} options
 */
export async function gtBuild({ watch, minify, cwd, name, copy }) {
	// Getting entry file
	const entry = existsSync(resolve(cwd, 'scripts/index.ts'))
		? resolve(cwd, 'scripts/index.ts')
		: resolve(cwd, 'scripts/index.js');

	// Ensuring existence
	if (!existsSync(entry)) {
		console.log(`${bold(red('Error'))} Missing entrypoint!`);
		process.exit(1);
	}

	const outdir = resolve(cwd, mckit.base);
	const resources = resolve(cwd, 'resources');
	const behaviors = resolve(cwd, 'behaviors');

	/** @type {import('esbuild').BuildOptions} */
	const baseOptions = {
		entryPoints: [entry],
		outdir: resolve(cwd, mckit.scripts),
		bundle: true,
		external: ['mojang-*'],
		format: 'esm',
		minify,
	};

	/** @type {import('esbuild').BuildResult} */
	let result;
	if (watch) {
		result = await build({
			...baseOptions,
			incremental: true,
			watch: {
				onRebuild(error, result) {
					if (error) {
						return console.log(
							`${bold(red('Error'))} ${error.name}: ${error.message}`
						);
					}

					console.clear();

					console.log(`${bold(blue('Rebuilding'))}`);

					if (copy) {
						copyToMinecraft(cwd, outdir, name, copy);
					}
				},
			},
		});

		console.log(`${bold(green('Build complete, watching for changes'))}`);

		chokidar
			.watch([resources, behaviors], { ignoreInitial: true })
			.on('all', (event, path) => {
				switch (event) {
					case 'add':
					case 'change':
						console.log(
							`${bold(cyan(event === 'add' ? 'Added' : 'Changed'))} ${path}`
						);
						result.rebuild();
						if (copy) {
							copyToMinecraft(cwd, outdir, name, copy);
						}
						break;
				}
			});
	} else {
		result = await build(baseOptions);
		console.log(`${bold(green('Build Successful'))}`);
	}

	await copyToMinecraft(cwd, outdir, name, copy);
}

export async function zip(cwd, name) {
	await Promise.all([
		pack(cwd, resolve(cwd, mckit.behaviors)),
		pack(cwd, resolve(cwd, mckit.resources)),
	]);

	return new Promise((res, rej) => {
		const output = createWriteStream(
			resolve(cwd, mckit.base, `${name}.mcaddon`)
		);
		const archive = archiver('zip');

		output.on('close', () => {
			res();
		});

		output.on('error', (err) => {
			rej(err);
		});

		archive.pipe(output);

		archive.glob('*.pack', { cwd: resolve(cwd, mckit.base) });

		archive.finalize();
	});
}

/**
 * @param {string} cwd
 * @param {string} name
 * @param {string} dir
 * @returns {Promise<string>}
 */
function pack(cwd, dir) {
	return new Promise((res, rej) => {
		const dirname = basename(dir);

		const path = resolve(cwd, mckit.base, `${dirname}.mcpack`);

		const output = createWriteStream(path);

		const archive = archiver('zip');

		output.on('close', () => {
			res(path);
		});

		output.on('error', (err) => {
			rej(err);
		});

		archive.pipe(output);

		archive.directory(dir);

		archive.finalize();
	});
}
