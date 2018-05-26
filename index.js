const path = require('path')
const execa = require('execa')
const tempy = require('tempy')
const webpack = require('webpack')

function parse(pkg) {
  const raw = pkg.split('@')
  if (raw.length < 1) throw new Error()
  return raw[0]
}

function install(pkg, dir) {
  return execa('npm', ['install', pkg], {cwd: dir})
}

function build(pkg, dir) {
  const config = {
    mode: 'production',
    context: dir,
    entry: pkg,
    output: {path: path.resolve(dir, 'dist')}
  }
  return new Promise((resolve, reject) => {
    webpack(config, (error, stats) => {
      if (error) reject(error)
      if (stats.hasErrors()) reject(stats.toString())
      else resolve(stats.toJson({assets: true}).assets[0].size)
    })
  })
}

async function bundleSizer(pkg, dependencies = []) {
  const cwd = await tempy.directory()
  for (const dep of dependencies) await install(dep, cwd)
  await install(pkg, cwd)
  const name = parse(pkg)
  return build(name, cwd)
}

module.exports = bundleSizer
