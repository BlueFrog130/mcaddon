import { copy, getFiles, mkdirp } from './util.js';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { randomUUID } from 'crypto';

/**
 * @param {string} dir
 * @param {{ template: string, gametest: boolean, typescript: boolean, name: string }} options
 */
export async function create(dir, options) {
	mkdirp(dir);

	if (options.template === 'both') {
		writeTemplate('rp', dir);
		writeTemplate('bp', dir);
	} else {
		writeTemplate(options.template, dir);
	}

	if (options.gametest) {
		const template = options.typescript ? 'ts' : 'js';
		writeTemplate(template, dir);
	}

	writeCommon(dir);

	const files = getFiles(dir);

	updateFiles(files, options.name);
}

/**
 * @param {string} template
 * @param {string} cwd
 */
function writeTemplate(template, cwd) {
	const dir = fileURLToPath(
		new URL(`./templates/${template}`, import.meta.url).href
	);
	copy(dir, cwd);
}

/**
 * @param {string} cwd
 */
function writeCommon(cwd) {
	const dir = fileURLToPath(new URL(`./shared`, import.meta.url).href);
	copy(dir, cwd);
}

/**
 * Replaces \~TEMP\~ variables with the corresponding data
 * @param {Array<string>} files
 * @param {string} name
 */
function updateFiles(files, name) {
	files.forEach((file) => {
		const data = fs
			.readFileSync(file, 'utf-8')
			.replace(/~NAME~/g, name)
			.replace(/~NEW_UUID~/g, () => randomUUID());
		fs.writeFileSync(file, data, { encoding: 'utf-8' });
	});
}
