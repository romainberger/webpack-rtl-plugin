import path from 'path'
import {createHash} from 'crypto'
import rtlcss from 'rtlcss'
import {ConcatSource} from 'webpack-sources'
import cssDiff from '@romainberger/css-diff'
import {forEachOfLimit} from 'async'
import cssnano from 'cssnano'

const WebpackRTLPlugin = function(options = {filename: false, options: {}, plugins: []}) {
  this.options = options
  this.chunkHashs = {};
  this.pliginName = 'webpack-rtl-plugin';
}

WebpackRTLPlugin.prototype.apply = function(compiler) {
  if (this.options.options.updateRuntimeChunk) {
    const rtlFlag = this.options.rtlFlag || 'IS_RTL';
    compiler.hooks.thisCompilation.tap(this.pliginName, compilation => {
      compilation.mainTemplate.hooks.requireEnsure.tap(this.pliginName, (source, chunk, hash) => {
        // already updated
        if (source.indexOf('.rtl.css') !== -1){
          return source;
        }
        return source.replace(/(var href.*)("\.css";)/i, '$1 (' + rtlFlag + ' ? ".rtl.css" : ".css");');
      });
    });
  }

  compiler.hooks.emit.tap(this.pliginName, (compilation) => {
    const changedChunks = compilation.chunks.filter((chunk) => {
      const name = chunk.name || chunk.id;
      const prevHash = this.chunkHashs[name];
      const currHash = chunk.hash;
      this.chunkHashs[name] = currHash;
      return !prevHash || (currHash !== prevHash);
    });

    forEachOfLimit(changedChunks, 5, (chunk, key, cb) => {
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
    })
  })
}

module.exports = WebpackRTLPlugin
