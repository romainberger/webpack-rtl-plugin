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
    new WebpackRTLPlugin(),
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
})
