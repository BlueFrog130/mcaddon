#!/usr/bin/env node
import { build } from 'esbuild';
import { existsSync, createWriteStream } from 'fs';
import { rm } from 'fs/promises';
import { copy } from './util.js';
import { basename, resolve } from 'path';
import { bold, red, green, blue, cyan } from 'kleur/colors';
import { homedir } from 'os';
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
 * @param {string} name
 */
async function copyToMinecraft(cwd, name) {
	// moving resources
	const resources = resolve(cwd, mckit.resources);
	if (existsSync(resources)) {
		const minecraftResourceDir = resolve(
			minecraftDir,
			'development_resource_packs',
			`${name} - resources`
		);

		await rm(minecraftResourceDir, { recursive: true, force: true });
		copy(resources, minecraftResourceDir);
	}

	// moving behaviors
	const behaviors = resolve(cwd, mckit.behaviors);
	if (existsSync(behaviors)) {
		const minecraftBehaviorDir = resolve(
			minecraftDir,
			'development_behavior_packs',
			`${name} - behaviors`
		);

		await rm(minecraftBehaviorDir, { recursive: true, force: true });
		copy(behaviors, minecraftBehaviorDir);
	}
}

/**
 * Copies everything to temp kit directory
 * @param {string} cwd
 */
function copyToTmp(cwd) {
	const resources = resolve(cwd, 'resources');
	if (existsSync(resources)) {
		copy(resources, resolve(cwd, mckit.resources));
	}

	const behaviors = resolve(cwd, 'behaviors');
	if (existsSync(behaviors)) {
		copy(behaviors, resolve(cwd, mckit.behaviors));

		const scripts = resolve(cwd, mckit.scripts);
		if (existsSync(scripts)) {
			copy(scripts, resolve(mckit.behaviors, 'scripts'));
		}
	}
}

/**
 * @param {{ watch: boolean, minify: boolean, cwd: string, name: string, copy: boolean }} options
 */
async function gtBuild({ watch, minify, cwd, name, copy }) {
	const hasScripts = existsSync(resolve(cwd, 'scripts'));

	// Getting entry file
	const entry = existsSync(resolve(cwd, 'scripts/index.ts'))
		? resolve(cwd, 'scripts/index.ts')
		: resolve(cwd, 'scripts/index.js');

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
		if (hasScripts) {
			result = await build({
				...baseOptions,
				incremental: true,
			});
		}

		console.log(`${bold(green('Build complete, watching for changes'))}`);

		chokidar
			.watch(['resources', 'behaviors', 'scripts'], { ignoreInitial: true })
			.on('all', async (event, path) => {
				switch (event) {
					case 'add':
					case 'change':
						console.log(
							`${bold(cyan(event === 'add' ? 'Added' : 'Changed'))} ${path}`
						);
						await result.rebuild();
						copyToTmp(cwd);
						if (copy) {
							await copyToMinecraft(cwd, name);
						}
						break;
				}
			});
	} else {
		if (hasScripts) {
			result = await build(baseOptions);
		}
		console.log(`${bold(green('Build Successful'))}`);
	}

	copyToTmp(cwd);

	if (copy) {
		await copyToMinecraft(cwd, name);
	}
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

export { gtBuild as build };
