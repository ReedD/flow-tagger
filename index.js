#!/usr/bin/env node
'use strict';

require('yargs')
	.commandDir('commands')
	.demandCommand(1)
	.help()
	.argv;
