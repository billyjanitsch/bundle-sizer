const fs = require('fs')
const path = require('path')

const execa = require('execa')
const gzipSize = require('gzip-size')
const ora = require('ora')
const pacote = require('pacote')
const prettyBytes = require('pretty-bytes')
const tempy = require('tempy')
const {rollup} = require('rollup')
const {nodeResolve} = require('@rollup/plugin-node-resolve')
const {terser} = require('rollup-plugin-terser')

const spinner = ora()

function install(packages, cwd) {
  return execa('npm', ['install', ...packages], {cwd})
}

async function build(input, output) {
  const bundle = await rollup({input, plugins: [nodeResolve(), terser()]})
  await bundle.write({file: output, format: 'es'})
}

module.exports = async function getBundledSize(pkg, options) {
  try {
    const {verbose} = options

    spinner.start('resolving')
    const {name, peerDependencies = {}, _resolved: resolved} = await pacote.manifest(pkg)
    if (verbose) spinner.info(`resolved to ${resolved}`)

    spinner.start('installing')
    const cwd = path.resolve(tempy.directory())
    await install([resolved, ...Object.keys(peerDependencies)], cwd)
    const inputFile = `${cwd}/input.js`
    const outputFile = `${cwd}/output.js`
    fs.writeFileSync(inputFile, `export * from '${name}'`)

    spinner.start('bundling')
    await build(inputFile, outputFile)
    if (verbose) spinner.info(`built ${outputFile}`)

    const {size} = fs.statSync(outputFile)
    const gzip = await gzipSize.file(outputFile)
    spinner.succeed(`${prettyBytes(size)} (${prettyBytes(gzip)} gzipped)`)
    return {file: outputFile, resolved, size, gzip}
  } catch (error) {
    spinner.fail(error)
    throw error
  }
}
