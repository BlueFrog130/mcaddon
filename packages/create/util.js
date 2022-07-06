import fs from 'fs';
import path from 'path';

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
 * @param {string | undefined} dirPath
 * @param {Array<string> | undefined} arrayOfFiles
 * @returns {Array<string>}
 */
export function getFiles(dirPath, ext, arrayOfFiles) {
	const files = fs.readdirSync(dirPath);

	arrayOfFiles = arrayOfFiles || [];

	files.forEach((file) => {
		if (fs.statSync(dirPath + '/' + file).isDirectory()) {
			arrayOfFiles = getFiles(dirPath + '/' + file, ext, arrayOfFiles);
		} else {
			if (ext === undefined || path.extname(file) === ext) {
				arrayOfFiles.push(path.join(dirPath, '/', file));
			}
		}
	});

	return arrayOfFiles;
}
