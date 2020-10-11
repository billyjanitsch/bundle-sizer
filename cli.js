#!/usr/bin/env node
const minimist = require('minimist')

const bundledSize = require('.')

const argv = minimist(process.argv.slice(2))

if (!argv._ || argv._.length !== 1) throw new Error('Must provide a single package.')
const [pkg] = argv._

const options = {
  verbose: !!argv.v || !!argv.verbose,
}

bundledSize(pkg, options)
