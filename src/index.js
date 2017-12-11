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
  compiler.plugin('emit', (compilation, callback) => {
    forEachOfLimit(compilation.assets, 5, (asset, key, cb) => {
      var cssnanoPromise = Promise.resolve()

      if (path.extname(key) === '.css') {
        const baseSource = asset.source()
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
          const newFilename = `${path.basename(key, '.css')}.rtl`
          filename = key.replace(path.basename(key, '.css'), newFilename)
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
            });

            const originalMinify = cssnano.process(baseSource, nanoOptions).then(output => {
              compilation.assets[key] = new ConcatSource(output.css)
            });

            return Promise.all([rtlMinify, originalMinify]);
          })
        }
        else {
          compilation.assets[filename] = new ConcatSource(rtlSource)
        }
      }

      cssnanoPromise.then(() => {
        cb()
      })
    }, callback)
  })
}

module.exports = WebpackRTLPlugin
