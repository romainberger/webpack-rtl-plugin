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
  })

  it('should create a second bundle', (done) => {
    webpack(baseConfig, (err, stats) => {
      if (err) {
        return done(err)
      }

      if (stats.hasErrors()) {
        return done(new Error(stats.toString()))
      }

      expect(fs.existsSync(path.join(__dirname, 'dist/bundle.js'))).to.be.true
      expect(fs.existsSync(path.join(__dirname, 'dist/style.css'))).to.be.true
      expect(fs.existsSync(path.join(__dirname, 'dist/style.rtl.css'))).to.be.true
      done()
    })
  })
})
