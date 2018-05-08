import path from 'path'
import {createHash} from 'crypto'
import rtlcss from 'rtlcss'
import {ConcatSource} from 'webpack-sources'
import cssDiff from '@romainberger/css-diff'
import {forEachOfLimit} from 'async'
import cssnano from 'cssnano'

const WebpackRTLPlugin = function(options = {filename: false, options: {}, plugins: []}) {
  this.options = options
}

WebpackRTLPlugin.prototype.apply = function(compiler) {
  compiler.hooks.emit.tapAsync('WebpackRTLPlugin', (compilation, callback) => {
    forEachOfLimit(compilation.chunks, 5, (chunk, key, cb) => {
      var rtlFiles = [],
          cssnanoPromise = Promise.resolve()

      chunk.files.forEach((asset) => {
        if (path.extname(asset) === '.css') {
          const baseSource = compilation.assets[asset].source()
          let rtlSource = rtlcss.process(baseSource, this.options.options, this.options.plugins)
          let filename

          if (this.options.filename) {
            filename = this.options.filename

            if (/\[contenthash\]/.test(this.options.filename)) {
              const hash = createHash('md5').update(rtlSource).digest('hex').substr(0, 10)
              filename = filename.replace('[contenthash]', hash)
            }
          }
          else {
            const newFilename = `${path.basename(asset, '.css')}.rtl`
            filename = asset.replace(path.basename(asset, '.css'), newFilename)
          }

          if (this.options.diffOnly) {
            rtlSource = cssDiff(baseSource, rtlSource)
          }

          if (this.options.minify !== false) {
            let nanoOptions = {}
            if (typeof this.options.minify === 'object') {
              nanoOptions = this.options.minify
            }

            cssnanoPromise = cssnanoPromise.then(() => {

              const rtlMinify = cssnano.process(rtlSource, nanoOptions).then(output => {
                compilation.assets[filename] = new ConcatSource(output.css)
                rtlFiles.push(filename)
              });

              const originalMinify = cssnano.process( baseSource, nanoOptions).then(output => {
                compilation.assets[asset] = new ConcatSource(output.css)
              });

              return Promise.all([rtlMinify,originalMinify]);
            })
          }
          else {
            compilation.assets[filename] = new ConcatSource(rtlSource)
            rtlFiles.push(filename)
          }
        }
      })

      cssnanoPromise.then(() => {
        chunk.files.push.apply(chunk.files, rtlFiles)
        cb()
      })
    }, callback)
  })
}

module.exports = WebpackRTLPlugin
