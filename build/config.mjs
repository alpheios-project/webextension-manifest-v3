import cleanWP from 'clean-webpack-plugin'
import CopyWebpackPlugin  from 'copy-webpack-plugin'
import path from 'path'
const projectRoot = process.cwd()

const webpack = {
  common: {
    entry: {
      'background': './background.js',
      'content': './content.js',
    },
    plugins: [
      new cleanWP.CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: ['background*.js*', 'content*.js*']
      }),
      new CopyWebpackPlugin ({
        patterns: [
          { from: path.resolve(projectRoot, 'src/manifest'), to: path.resolve(projectRoot, 'dist') },
          { from: path.resolve(projectRoot, 'src/support'), to: path.resolve(projectRoot, 'dist/support') },
          { from: path.resolve(projectRoot, 'src/icons'), to: path.resolve(projectRoot, 'dist/icons') },
          { from: path.resolve(projectRoot, 'node_modules/alpheios-core/packages/components/dist/style'), to: path.resolve(projectRoot, 'dist/style') }
        ],
      }),
    ]
  },

  production: {
    mode: 'production',
    output: { filename: '[name].js' },
    resolve: {
      alias: {
        'alpheios-data-models$': path.join(projectRoot, 'node_modules/alpheios-core/packages/data-models/dist/alpheios-data-models.min.js'),
        'alpheios-components$': path.join(projectRoot, 'node_modules/alpheios-core/packages/components/dist/alpheios-components.min.js'),
        '@': path.join(projectRoot, 'src')
      }
    }
  },

  development: {
    mode: 'development',
    output: { filename: '[name].js' },
    resolve: {
      alias: {
        'alpheios-data-models$': path.join(projectRoot, 'node_modules/alpheios-core/packages/data-models/dist/alpheios-data-models.min.js'),
        'alpheios-components$': path.join(projectRoot, 'node_modules/alpheios-core/packages/components/dist/alpheios-components.min.js'),
        '@': path.join(projectRoot, 'src')
      }
    }
  }
}

export { webpack }




