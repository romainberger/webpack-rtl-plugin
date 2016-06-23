import fs from 'fs'
import path from 'path'
import {expect} from 'chai'
import webpack from 'webpack'
import WebpackRTLPlugin from '../src'
import ExtractTextPlugin from 'extract-text-webpack-plugin'

const baseConfig = {
  entry: path.join(__dirname, 'src/index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader'),
      }
    ],
  },
  plugins: [
    new ExtractTextPlugin('style.css'),
    new WebpackRTLPlugin({
      minify: false,
    }),
  ],
}

describe('Webpack RTL Plugin', () => {
  it('should export a function', () => {
    expect(WebpackRTLPlugin).to.be.a('function')
    expect(require('../')).to.be.a('function')
  })

  const bundlePath = path.join(__dirname, 'dist/bundle.js')
  const cssBundlePath = path.join(__dirname, 'dist/style.css')
  const rtlCssBundlePath = path.join(__dirname, 'dist/style.rtl.css')

  describe('Bundling', () => {
    before(done => {
      webpack(baseConfig, (err, stats) => {
        if (err) {
          return done(err)
        }

        if (stats.hasErrors()) {
          return done(new Error(stats.toString()))
        }

        done()
      })
    })

    it('should create a second bundle', () => {
      expect(fs.existsSync(bundlePath)).to.be.true
      expect(fs.existsSync(cssBundlePath)).to.be.true
      expect(fs.existsSync(rtlCssBundlePath)).to.be.true
    })

    it('should contain the correct content', () => {
      const contentCss = fs.readFileSync(cssBundlePath, 'utf-8')
      const contentRrlCss = fs.readFileSync(rtlCssBundlePath, 'utf-8')

      expect(contentCss).to.contain('padding-left: 10px;')
      expect(contentRrlCss).to.contain('padding-right: 10px;')
    })
  })

  describe('Filename options', () => {
    let cssBundleName
    let rtlCssBundleName
    let cssBundlePath
    let rtlCssBundlePath

    before(done => {
      const config = {
        ...baseConfig,
        output: {
          path: path.resolve(__dirname, 'dist-hash'),
          filename: 'bundle.js',
        },
        plugins: [
          new ExtractTextPlugin('style.[contenthash].css'),
          new WebpackRTLPlugin({
            filename: 'style.[contenthash].rtl.css',
            minify: false,
          }),
        ],
      }

      webpack(config, (err, stats) => {
        if (err) {
          return done(err)
        }

        if (stats.hasErrors()) {
          return done(new Error(stats.toString()))
        }

        Object.keys(stats.compilation.assets).forEach(asset => {
          const chunk = asset.split('.')

          if (path.extname(asset) === '.css') {
            if (chunk[chunk.length - 2] === 'rtl') {
              rtlCssBundleName = asset
              rtlCssBundlePath = path.join(__dirname, 'dist-hash', asset)
            }
            else {
              cssBundleName = asset
              cssBundlePath = path.join(__dirname, 'dist-hash', asset)
            }
          }
        })

        done()
      })
    })

    it('should create a two css bundles', () => {
      expect(fs.existsSync(cssBundlePath)).to.be.true
      expect(fs.existsSync(rtlCssBundlePath)).to.be.true
    })

    it('should create a second bundle with a different hash', () => {
      const cssChunk = cssBundleName.split('.')
      const rtlCssChunk = rtlCssBundleName.split('.')

      expect(cssChunk[1]).to.not.equal(rtlCssChunk[1])
    })
  })

  describe('Rtlcss options', () => {
    const rtlCssBundlePath = path.join(__dirname, 'dist-options/style.rtl.css')

    before(done => {
      const config = {
        ...baseConfig,
        output: {
          path: path.resolve(__dirname, 'dist-options'),
          filename: 'bundle.js',
        },
        plugins: [
          new ExtractTextPlugin('style.css'),
          new WebpackRTLPlugin({
            options: {
              autoRename: true,
              stringMap: [
                {
                  search: 'prev',
                  replace: 'next',
                  options: {
                    scope: '*',
                  },
                },
              ],
            },
            minify: false,
          }),
        ],
      }

      webpack(config, (err, stats) => {
        if (err) {
          return done(err)
        }

        if (stats.hasErrors()) {
          return done(new Error(stats.toString()))
        }

        done()
      })
    })

    it('should follow the options given to rtlcss', () => {
      const contentRrlCss = fs.readFileSync(rtlCssBundlePath, 'utf-8')
      expect(contentRrlCss).to.contain('.next {')
    })
  })

  describe('Diff', () => {
    const rtlCssBundlePath = path.join(__dirname, 'dist-diff/style.rtl.css')

    before(done => {
      const config = {
        ...baseConfig,
        output: {
          path: path.resolve(__dirname, 'dist-diff'),
          filename: 'bundle.js',
        },
        plugins: [
          new ExtractTextPlugin('style.css'),
          new WebpackRTLPlugin({
            diffOnly: true,
            minify: false,
          }),
        ],
      }

      webpack(config, (err, stats) => {
        if (err) {
          return done(err)
        }

        if (stats.hasErrors()) {
          return done(new Error(stats.toString()))
        }

        done()
      })
    })

    it('should only contain the diff between the source and the rtl version', () => {
      const contentRrlCss = fs.readFileSync(rtlCssBundlePath, 'utf-8')
      const expected = fs.readFileSync(path.join(__dirname, 'rtl-diff-result.css'), 'utf-8')
      expect(contentRrlCss).to.equal(expected)
    })
  })

  describe('Minify', () => {
    const rtlCssBundlePath = path.join(__dirname, 'dist-min/style.rtl.css')

    before(done => {
      const config = {
        ...baseConfig,
        output: {
          path: path.resolve(__dirname, 'dist-min'),
          filename: 'bundle.js',
        },
        plugins: [
          new ExtractTextPlugin('style.css'),
          new WebpackRTLPlugin(),
        ],
      }

      webpack(config, (err, stats) => {
        if (err) {
          return done(err)
        }

        if (stats.hasErrors()) {
          return done(new Error(stats.toString()))
        }

        done()
      })
    })

    it('should minify the css', () => {
      const contentRrlCss = fs.readFileSync(rtlCssBundlePath, 'utf-8')
      const expected = '.foo{padding-right:10px}.bar{position:absolute;left:100px}.prev{width:10px}.foo .bar{height:10px}'
      expect(contentRrlCss).to.contain(expected)
    })
  })
})
