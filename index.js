const path = require('path')

const execa = require('execa')
const gzipSize = require('gzip-size')
const pacote = require('pacote')
const tempy = require('tempy')
const webpack = require('webpack')

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

async function getBundledSize(pkg) {
  const {name, peerDependencies, _resolved: resolved} = await pacote.manifest(pkg)
  const cwd = await tempy.directory()
  await install([resolved, ...Object.keys(peerDependencies)], cwd)
  const {file, size} = await build(name, cwd)
  const gzip = await gzipSize.file(file)
  return {file, resolved, size, gzip}
}

module.exports = getBundledSize
