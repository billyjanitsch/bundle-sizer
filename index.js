const path = require('path')

const execa = require('execa')
const gzipSize = require('gzip-size')
const ora = require('ora')
const pacote = require('pacote')
const prettyBytes = require('pretty-bytes')
const tempy = require('tempy')
const webpack = require('webpack')

const spinner = ora()

function install(packages, cwd) {
  return execa('npm', ['install', ...packages], {cwd})
}

function build(entry, dir) {
  const config = {
    mode: 'production',
    context: dir,
    entry,
    output: {path: dir},
    node: false,
  }
  return new Promise((resolve, reject) => {
    webpack(config, (error, stats) => {
      if (error) reject(error)
      if (stats.hasErrors()) reject(stats.toString())
      else {
        const {name, size} = stats.toJson({assets: true}).assets[0]
        const file = path.resolve(dir, name)
        resolve({file, size})
      }
    })
  })
}

module.exports = async function getBundledSize(pkg, options) {
  try {
    const {verbose} = options

    spinner.start('resolving')
    const {name, peerDependencies, _resolved: resolved} = await pacote.manifest(pkg)
    if (verbose) spinner.info(`resolved to ${resolved}`)

    spinner.start('installing')
    const cwd = await tempy.directory()
    await install([resolved, ...Object.keys(peerDependencies)], cwd)

    spinner.start('bundling')
    const {file, size} = await build(name, cwd)
    if (verbose) spinner.info(`built ${file}`)

    const gzip = await gzipSize.file(file)
    spinner.succeed(`${prettyBytes(size)} (${prettyBytes(gzip)} gzipped)`)
    return {file, resolved, size, gzip}
  } catch (error) {
    spinner.fail(error)
    throw error
  }
}
