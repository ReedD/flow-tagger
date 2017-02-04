'use strict';

const Bluebird = require('bluebird');
const fs       = require('fs');
const nodegit  = require('nodegit-flow');
const semver   = require('semver');
const yargs    = require('yargs');

const argv = yargs
	.fail((message, error) => {
		console.error(message);
		if (error) console.error(error.stack);
		process.exit();
	})
	.option('b', {
		alias: 'bump',
		choices: ['major', 'minor', 'patch'],
		default: 'patch',
		describe: 'Version bump type'
	})
	.help()
	.wrap(null)
	.argv;

const pkgPath = 'package.json';
const pkg     = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const newVer  = semver.inc(pkg.version, `pre${argv.bump}`, 'beta');
const repo    = nodegit.Repository.open('./');

const updateVersion = () => {
	pkg.version = newVer;
	fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
	return Bluebird
		.resolve();
};
const commitUpdates = () => {
	return repo
		.then(repo => {
			const signature = nodegit.Signature.default(repo);
			const message   = `Update version string to ${newVer}`;
			return repo
				.createCommitOnHead([pkgPath], signature, signature, message);
		});
};
const createTag = oid => {
	return repo
		.then(repo => {
			const message = `Release beta version ${newVer}`;
			return repo.createTag(oid, newVer, message);
		});
};
const pushRelease = () => {
	return repo
		.then(repo => {
			return repo
				.getRemote('origin');
		})
		.then(remote => {
			return remote.push([
				'refs/heads/develop:refs/heads/develop',
				`refs/tags/${newVer}:refs/tags/${newVer}`
			], {
				callbacks: {
					credentials: (url, username) => {
						return nodegit.Cred
							.sshKeyFromAgent(username);
					}
				}
			});
		});
};
updateVersion()
	.then(commitUpdates)
	.then(createTag)
	.then(pushRelease)
	.then(() => {
		console.log(`Version ${newVer} released!`);
	})
	.catch(error => {
		console.error(error);
		console.error(error.stack);
	});
