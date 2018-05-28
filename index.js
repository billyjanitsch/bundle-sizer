const path = require('path')
const execa = require('execa')
const tempy = require('tempy')
const webpack = require('webpack')

function parse(pkg) {
  const [name] = pkg.match(/^@?[^@]+/)
  if (!name) throw new Error(`Couldn't parse package ${pkg}.`)
  return name
}

function install(packages, dir) {
  return execa('npm', ['install', ...packages], {cwd: dir})
}

function build(pkg, dir) {
  const config = {
    mode: 'production',
    context: dir,
    entry: pkg,
    output: {path: dir},
    node: false,
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
  await install([pkg, ...dependencies], cwd)
  const name = parse(pkg)
  return build(name, cwd)
}

module.exports = bundleSizer
