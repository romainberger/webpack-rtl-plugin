# Webpack RTL Plugin [![Build Status](https://img.shields.io/travis/romainberger/webpack-rtl-plugin/master.svg?style=flat-square)](https://travis-ci.org/romainberger/webpack-rtl-plugin) [![npm version](https://img.shields.io/npm/v/webpack-rtl-plugin.svg?style=flat-square)](https://www.npmjs.com/package/webpack-rtl-plugin)

Webpack plugin to use in addition to [extract-text-webpack-plugin](https://github.com/webpack/extract-text-webpack-plugin) to create a second css bundle, processed to be rtl.

This uses [rtlcss](https://github.com/MohammadYounes/rtlcss) under the hood, please refer to its documentation for supported properties.

Check out the [webpack-rtl-example](https://github.com/romainberger/webpack-rtl-example) to see an example of an app using the rtl-css-loader and webpack-rtl-plugin.

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

## Options

```
new WebpackRTLPlugin({
  filename: 'style.[contenthash].rtl.css',
  options: {},
  plugins: [],
  diffOnly: false,
  minify: true,
})
```

* `filename` the filename of the result file. May contain `[contenthash]`. Default to `style.css`.
  * `[contenthash]` a hash of the content of the extracted file
* `options` Options given to `rtlcss`. See the [rtlcss documentation for available options](http://rtlcss.com/learn/usage-guide/options/).
* `plugins` RTLCSS plugins given to `rtlcss`. See the [rtlcss documentation for writing plugins](http://rtlcss.com/learn/extending-rtlcss/writing-a-plugin/). Default to `[]`.
* `diffOnly` If set to `true`, the stylesheet created will only contain the css that differs from the source stylesheet. Default to `false`.
* `minify` will minify the css. You can also pass an object for the arguments passed to `cssnano`. Default to `true`.
