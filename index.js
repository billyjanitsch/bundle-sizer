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
  const manifest = await pacote.manifest(pkg)
  const peerDependencies = Object.keys(manifest.peerDependencies)
  const cwd = await tempy.directory()
  await install([pkg, ...peerDependencies], cwd)
  const entry = manifest.name
  const {file, size} = await build(entry, cwd)
  const gzip = await gzipSize.file(file)
  return {file, size, gzip}
}

module.exports = getBundledSize
