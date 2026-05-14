const path = require('path');
const { createRequire } = require('module');

const appRequire = createRequire(path.resolve(__dirname, '../package.json'));
const jestPackagePath = appRequire.resolve('jest/package.json');
const jestRequire = createRequire(jestPackagePath);
const jestCliPackagePath = jestRequire.resolve('jest-cli/package.json');
const runPath = path.join(path.dirname(jestCliPackagePath), 'build', 'run.js');
const { run } = require(runPath);

run(process.argv.slice(2), process.cwd());