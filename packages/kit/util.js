import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * @param {string} dir
 */
export function mkdirp(dir) {
	try {
		fs.mkdirSync(dir, { recursive: true });
	} catch (e) {
		if (e.code === 'EEXIST') return;
		throw e;
	}
}

/**
 * @param {string} from
 * @param {string} to
 */
export function copy(from, to) {
	if (!fs.existsSync(from)) return;

	const stats = fs.statSync(from);

	if (stats.isDirectory()) {
		fs.readdirSync(from).forEach((file) => {
			copy(path.join(from, file), path.join(to, file));
		});
	} else {
		mkdirp(path.dirname(to));
		fs.copyFileSync(from, to);
	}
}

/**
 * @param {string} dir
 * @returns {string}
 */
export function dist(dir) {
	console.log(dir, import.meta.url);
	return fileURLToPath(new URL(dir, import.meta.url).href);
}
