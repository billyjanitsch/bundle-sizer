const path = require('path')
const execa = require('execa')
const tempy = require('tempy')
const webpack = require('webpack')

function parse(pkg) {
  const raw = pkg.split('@')
  if (raw.length < 1) throw new Error()
  const name = raw[0]
  const version = raw.length > 1 ? raw[1] : 'latest'
  return {name, version}
}

function install(pkg, cwd) {
  const {name, version} = parse(pkg)
  return execa('npm', ['install', `${name}@${version}`], {cwd})
}

function build(entry, context) {
  const outputDir = path.resolve(context, 'dist')
  const config = {context, entry, mode: 'production', output: {path: outputDir}}
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
  const {name} = parse(pkg)
  return build(name, cwd)
}

module.exports = bundleSizer
