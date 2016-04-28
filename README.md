# Webpack RTL Plugin [![Build Status](https://img.shields.io/travis/romainberger/webpack-rtl-plugin/master.svg?style=flat-square)](https://travis-ci.org/romainberger/webpack-rtl-plugin)

Webpack plugin to use in addition to [extract-text-webpack-plugin](https://github.com/webpack/extract-text-webpack-plugin) to create a second css bundle, processed to be rtl.

This uses [rtlcss](https://github.com/MohammadYounes/rtlcss) under the hood, please refer to its documentation for supported properties.

## Installation

```shell
$ npm install webpack-rtl-plugin
```

## Usage

Add the plugin to your webpack configuration:

```js
import WebpackRTLPlugin from 'webpack-rtl-plugin'

module.exports = {
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
```

This will create the normal `style.css` and an additionnal `style.rtl.css`.
