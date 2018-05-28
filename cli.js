#!/usr/bin/env node
const minimist = require('minimist')
const prettyBytes = require('pretty-bytes')

const bundleSizer = require('.')

const argv = minimist(process.argv.slice(2))

if (!argv._ || argv._.length !== 1) throw new Error('Must provide a single package.')
const [pkg] = argv._

/* eslint-disable no-console */
bundleSizer(pkg)
  .then(result => {
    console.log(`built: ${result.file}`)
    const size = prettyBytes(result.size)
    const gzip = prettyBytes(result.gzip)
    console.log(`${pkg}: ${size} (${gzip} gzipped)`)
  })
  .catch(error => console.error(error))
