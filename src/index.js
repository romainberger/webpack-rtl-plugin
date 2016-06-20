import path from 'path'
import {createHash} from 'crypto'
import rtlcss from 'rtlcss'
import {ConcatSource} from 'webpack-sources'
import cssDiff from '@romainberger/css-diff'

const WebpackRTLPlugin = function(options = {filename: false, options: {}}) {
  this.options = options
}

WebpackRTLPlugin.prototype.apply = function(compiler) {
  compiler.plugin('emit', (compilation, callback) => {
    Object.keys(compilation.assets).forEach(asset => {
      if (path.extname(asset) === '.css') {
        const baseSource = compilation.assets[asset].source()
        let source = rtlcss.process(baseSource, this.options.options)
        let filename

        if (this.options.filename) {
          filename = this.options.filename

          if (/\[contenthash\]/.test(this.options.filename)) {
            const hash = createHash('md5').update(source).digest('hex').substr(0, 10)
            filename = filename.replace('[contenthash]', hash)
          }
        }
        else {
          filename = `${path.basename(asset, '.css')}.rtl.css`
        }

        if (this.options.diffOnly) {
          source = cssDiff(baseSource, source)
        }

        compilation.assets[filename] = new ConcatSource(source)
      }
    })

    callback()
  })
}

module.exports = WebpackRTLPlugin
