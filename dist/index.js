'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _crypto = require('crypto');

var _rtlcss = require('rtlcss');

var _rtlcss2 = _interopRequireDefault(_rtlcss);

var _webpackSources = require('webpack-sources');

var _cssDiff = require('@romainberger/css-diff');

var _cssDiff2 = _interopRequireDefault(_cssDiff);

var _async = require('async');

var _cssnano = require('cssnano');

var _cssnano2 = _interopRequireDefault(_cssnano);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var WebpackRTLPlugin = function WebpackRTLPlugin() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { filename: false, options: {}, plugins: [] };

  this.options = options;
};

WebpackRTLPlugin.prototype.apply = function (compiler) {
  var _this = this;

  compiler.plugin('emit', function (compilation, callback) {
    (0, _async.forEachOfLimit)(compilation.chunks, 5, function (chunk, key, cb) {
      var rtlFiles = [],
          cssnanoPromise = Promise.resolve();

      chunk.files.forEach(function (asset) {
        if (_path2.default.extname(asset) === '.css') {
          var baseSource = compilation.assets[asset].source();
          var rtlSource = _rtlcss2.default.process(baseSource, _this.options.options, _this.options.plugins);
          var filename = void 0;

          console.log('asset name:', asset, _this.options.filename);

          if (_this.options.filename) {
            filename = _this.options.filename;

            if (/\[contenthash]/.test(_this.options.filename)) {
              var hash = (0, _crypto.createHash)('md5').update(rtlSource).digest('hex').substr(0, 10);
              filename = filename.replace('[contenthash]', hash);
            }
          } else {
            var newFilename = _path2.default.basename(asset, '.css') + '.rtl';
            filename = asset.replace(_path2.default.basename(asset, '.css'), newFilename);
          }

          if (_this.options.diffOnly) {
            rtlSource = (0, _cssDiff2.default)(baseSource, rtlSource);
          }

          if (_this.options.minify !== false) {
            var nanoOptions = {};
            if (_typeof(_this.options.minify) === 'object') {
              nanoOptions = _this.options.minify;
            }

            cssnanoPromise = cssnanoPromise.then(function () {

              var rtlMinify = _cssnano2.default.process(rtlSource, nanoOptions).then(function (output) {
                compilation.assets[filename] = new _webpackSources.ConcatSource(output.css);
                rtlFiles.push(filename);
              });

              var originalMinify = _cssnano2.default.process(baseSource, nanoOptions).then(function (output) {
                compilation.assets[asset] = new _webpackSources.ConcatSource(output.css);
              });

              return Promise.all([rtlMinify, originalMinify]);
            });
          } else {
            compilation.assets[filename] = new _webpackSources.ConcatSource(rtlSource);
            rtlFiles.push(filename);
          }
        }
      });

      cssnanoPromise.then(function () {
        chunk.files.push.apply(chunk.files, rtlFiles);
        cb();
      });
    }, callback);
  });
};

module.exports = WebpackRTLPlugin;