const path = require('path')
const execa = require('execa')
const gzipSize = require('gzip-size')
const tempy = require('tempy')
const webpack = require('webpack')

function parse(pkg) {
  const [name] = pkg.match(/^@?[^@]+/)
  if (!name) throw new Error(`Couldn't parse package ${pkg}.`)
  return name
}

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

async function bundleSizer(pkg, dependencies = []) {
  const cwd = await tempy.directory()
  await install([pkg, ...dependencies], cwd)
  const entry = parse(pkg)
  const {file, size} = await build(entry, cwd)
  const gzip = await gzipSize.file(file)
  return {file, size, gzip}
}

module.exports = bundleSizer
