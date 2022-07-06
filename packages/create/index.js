import { copy, getFiles, mkdirp } from './util.js';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

/**
 * @param {string} dir
 * @param {{ typescript: boolean, resource: boolean }} options
 */
export async function create(dir, options) {
	mkdirp(dir);

	const template = options.typescript ? 'ts' : 'js';

	writeTemplate(template, options.name, dir);
	writeCommon(options.resource, options.name, dir);
}

/**
 * @param {'js' | 'ts'} template
 * @param {string} name
 * @param {string} cwd
 */
function writeTemplate(template, name, cwd) {
	const dir = fileURLToPath(
		new URL(`./templates/${template}`, import.meta.url).href
	);
	copy(dir, cwd);

	const files = getFiles(cwd);

	files.forEach((file) => {
		const data = fs.readFileSync(file, 'utf-8').replace(/~NAME~/g, name);
		fs.writeFileSync(file, data, { encoding: 'utf-8' });
	});
}

/**
 * @param {boolean} includeResource
 * @param {string} name
 * @param {string} cwd
 */
function writeCommon(includeResource, name, cwd) {
	const dir = fileURLToPath(new URL(`./shared`, import.meta.url).href);
	copy(dir, cwd);
	const files = getFiles(cwd);

	files.forEach((file) => {
		const data = fs
			.readFileSync(file, 'utf-8')
			.replace(/~NAME~/g, name)
			.replace(/~NEW_UUID~/g, () => randomUUID());
		fs.writeFileSync(file, data, { encoding: 'utf-8' });
	});

	if (!includeResource) {
		fs.rmSync(path.join(cwd, 'resources'), { force: true, recursive: true });
	}
}
