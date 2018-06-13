const path = require('path')

const execa = require('execa')
const gzipSize = require('gzip-size')
const ora = require('ora')
const pacote = require('pacote')
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

module.exports = async function getBundledSize(pkg) {
  spinner.start(`resolving package ${pkg}`)
  const {name, peerDependencies, _resolved: resolved} = await pacote.manifest(pkg)
  spinner.succeed(`resolved to ${resolved}`)
  const cwd = await tempy.directory()
  spinner.start('installing dependencies')
  await install([resolved, ...Object.keys(peerDependencies)], cwd)
  spinner.start('bundling package')
  const {file, size} = await build(name, cwd)
  spinner.succeed(`built ${file}`)
  const gzip = await gzipSize.file(file)
  return {file, resolved, size, gzip}
}
