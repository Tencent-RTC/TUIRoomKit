const { defineConfig } = require('@vue/cli-service');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const showAnalyze = process.argv.includes('--analyze');

module.exports = defineConfig({
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  transpileDependencies: true,
  chainWebpack: (config) => {
    if (process.env.NODE_ENV === 'production') {
      showAnalyze && config.plugin('BundleAnalyzerPlugin').use(BundleAnalyzerPlugin);
      config.optimization.splitChunks({
        chunks: 'all',
        maxSize: 3 * 1024 * 1024,
      });
    }
  },
});
