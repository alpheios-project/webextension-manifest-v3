const path = require('path');
const projectRoot = process.cwd()
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  devtool: 'cheap-module-source-map',
  entry: {
    'background': './src/background.js',
    'content': './src/content.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(projectRoot, 'dist')
  },
  resolve: {
    alias: {
      'alpheios-data-models$': path.join(projectRoot, 'node_modules/alpheios-core/packages/data-models/dist/alpheios-data-models.min.js'),
      'alpheios-components$': path.join(projectRoot, 'node_modules/alpheios-core/packages/components/dist/alpheios-components.min.js'),
      '@': path.join(projectRoot, 'src')
    }
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.resolve(projectRoot, 'src/manifest'), to: path.resolve(projectRoot, 'dist') },
        { from: path.resolve(projectRoot, 'src/support'), to: path.resolve(projectRoot, 'dist/support') },
        { from: path.resolve(projectRoot, 'src/icons'), to: path.resolve(projectRoot, 'dist/icons') },
        { from: path.resolve(projectRoot, 'node_modules/alpheios-core/packages/components/dist/style'), to: path.resolve(projectRoot, 'dist/style') }
      ],
    }),
  ]
};
