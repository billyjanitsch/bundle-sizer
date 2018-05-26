#!/usr/bin/env node
const minimist = require('minimist')
const prettyBytes = require('pretty-bytes')
const bundleSizer = require('.')

const argv = minimist(process.argv.slice(2))

if (!argv._ || !argv._.length) throw new Error('Must provide a package')
const [pkg, ...dependencies] = argv._

bundleSizer(pkg, dependencies)
  .then(size => console.log(`${pkg}: ${prettyBytes(size)}`))
  .catch(error => console.error(error))
