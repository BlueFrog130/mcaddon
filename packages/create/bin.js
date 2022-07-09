#!/usr/bin/env node

import fs from 'fs';
import prompts from 'prompts';
import { bold, red, cyan, green } from 'kleur/colors';
import { create } from './index.js';
import path from 'path';

console.log(`
${bold(cyan('Welcome to GameTest Framework!'))}

${bold(red('This project is in beta; Expect bugs and breaking changes'))}

`);

let cwd = process.argv[2] || '.';

if (cwd === '.') {
	const { dir } = await prompts({
		type: 'text',
		name: 'dir',
		message:
			'Where should this project be created?\n  (leave blank for current directory)',
	});

	if (dir) {
		cwd = dir;
	}
}

if (fs.existsSync(cwd) && fs.readdirSync(cwd).length > 0) {
	const { value } = await prompts({
		type: 'confirm',
		name: 'value',
		message: 'Directory not empty. Continue?',
		initial: false,
	});

	if (!value) {
		process.exit(1);
	}
}

const options = await prompts(
	[
		{
			name: 'template',
			type: 'select',
			message: 'Select a pack type',
			choices: [
				{ title: 'Resource', value: 'rp' },
				{ title: 'Behavior', value: 'bp' },
				{ title: 'both', value: 'both' },
			],
		},
		{
			name: 'gametest',
			type: (prev) =>
				prev === 'behaviors' || prev === 'both' ? 'toggle' : null,
			message: 'Add GameTest support?',
			initial: false,
			active: 'Yes',
			inactive: 'No',
		},
		{
			name: 'typescript',
			type: (prev, { gametest }) =>
				gametest && prev === true ? 'toggle' : null,
			message: 'Use TypeScript?',
			initial: true,
			active: 'Yes',
			inactive: 'No',
		},
	],
	{ onCancel: () => process.exit(1) }
);

options.name = path.basename(path.resolve(cwd));

await create(cwd, options);

console.log(`${bold(green('\nDone!'))}`);

console.log('\nNext steps:');
const relative = path.relative(process.cwd(), cwd);
if (relative !== '') {
	console.log(bold(cyan(`  cd ${relative}`)));
}

console.log(`${bold(cyan('  npm install'))} (or pnpm install, etc)`);
console.log(
	`${bold(
		cyan('  npm run watch')
	)} starts watching for changes and copies pack to development packs`
);

console.log(`\n To stop watching for changes, hit ${bold(cyan('Ctrl-C'))}`);
