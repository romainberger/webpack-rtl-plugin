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
  compiler.hooks.emit.tap(this.pliginName, (compilation) => {
    forEachOfLimit(compilation.chunks, 5, (chunk, key, cb) => {
      const rtlFiles = []
      let cssnanoPromise = Promise.resolve()

      chunk.files.forEach(asset => {
        const match = this.options.test ? new RegExp(this.options.test).test(asset) : true

        if (path.extname(asset) !== '.css') {
          return
        }

        const baseSource = compilation.assets[asset].source()
        let filename
        let rtlSource

        if (match) {
          rtlSource = rtlcss.process(baseSource, this.options.options, this.options.plugins)

          if (this.options.filename instanceof Array && this.options.filename.length === 2) {
            filename = asset.replace(this.options.filename[0], this.options.filename[1])
          }
          else if (this.options.filename) {
            filename = this.options.filename

            if (/\[contenthash]/.test(this.options.filename)) {
              const hash = createHash('md5').update(rtlSource).digest('hex').substr(0, 10)
              filename = filename.replace('[contenthash]', hash)
            }
            if (/\[id]/.test(this.options.filename)) {
              filename = filename.replace('[id]', chunk.id)
            }
            if (/\[name]/.test(this.options.filename)) {
              filename = filename.replace('[name]', chunk.name)
            }
            if (/\[file]/.test(this.options.filename)) {
              filename = filename.replace('[file]', asset)
            }
            if (/\[filebase]/.test(this.options.filename)) {
              filename = filename.replace('[filebase]', path.basename(asset))
            }
            if (/\[ext]/.test(this.options.filename)) {
              filename = filename.replace('.[ext]', path.extname(asset))
            }
          }
          else {
            const newFilename = `${path.basename(asset, '.css')}.rtl`
            filename = asset.replace(path.basename(asset, '.css'), newFilename)
          }

          if (this.options.diffOnly) {
            rtlSource = cssDiff(baseSource, rtlSource)
          }
        }

        if (this.options.minify !== false) {
          let nanoOptions = {}
          if (typeof this.options.minify === 'object') {
            nanoOptions = this.options.minify
          }

          cssnanoPromise = cssnanoPromise.then(() => {
            let minify = cssnano.process( baseSource, nanoOptions).then(output => {
              compilation.assets[asset] = new ConcatSource(output.css)
            });

            if (match) {
              const rtlMinify = cssnano.process(rtlSource, nanoOptions).then(output => {
                compilation.assets[filename] = new ConcatSource(output.css)
                rtlFiles.push(filename)
              });

              minify = Promise.all([minify, rtlMinify]);
            }

            return minify;
          })
        }
        else if (match) {
          compilation.assets[filename] = new ConcatSource(rtlSource)
          rtlFiles.push(filename)
        }
      })

      cssnanoPromise.then(() => {
        chunk.files.push.apply(chunk.files, rtlFiles)
        cb()
      })
    })
  })
}

module.exports = WebpackRTLPlugin
