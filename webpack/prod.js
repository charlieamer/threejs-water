// Import dependencies.
import { merge } from 'webpack-merge';
import TerserPlugin from 'terser-webpack-plugin';

// Import Configuration.
import { cleanWebpackPlugin } from './plugins';
import { WebpackCommonConfig } from './common';

/**
 * Plugins for production build.
 */
const plugins = [cleanWebpackPlugin];

/**
 * Webpack production configuration.
 */
const WebpackConfig = {
  plugins,
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  output: {
    publicPath: '/threejs-water/',
  },
};

// Export configuration.
export const WebpackProdConfig = merge(WebpackCommonConfig, WebpackConfig);
