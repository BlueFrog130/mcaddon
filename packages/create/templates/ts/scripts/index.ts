import { world } from 'mojang-minecraft';

let tick = 0;

const nextTick = () => {
	tick++;

	if (tick === 100) {
		world.getDimension('overworld').runCommandAsync('say Hello!');
	}
};

world.events.tick.subscribe(nextTick);