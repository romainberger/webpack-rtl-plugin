/* @flow */

import path from 'path'
import rtlcss from 'rtlcss'
import {ConcatSource} from 'webpack-sources'

export default function WebpackRTLPlugin() {}

WebpackRTLPlugin.prototype.apply = function(compiler) {
  compiler.plugin('emit', (compilation, callback) => {
    Object.keys(compilation.assets).forEach(asset => {
      if (path.extname(asset) === '.css') {
        const filename = `${path.basename(asset, '.css')}.rtl.css`
        const source = rtlcss.process(compilation.assets[asset].source())

        compilation.assets[filename] = new ConcatSource(source)
      }
    })

    callback()
  })
}
