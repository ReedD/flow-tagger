'use strict';

exports.command = 'hotfix <command>';
exports.desc    = 'Hotfix branch control';
exports.builder = (yargs) => {
	return yargs.commandDir('hotfix-commands');
};
exports.handler = (argv) => {};
