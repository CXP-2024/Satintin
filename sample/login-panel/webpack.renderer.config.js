const rules = require('./webpack.rules')
const plugins = require('./webpack.plugins')
const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin');

rules.push({
    test: /\.css$/,
    use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
})

module.exports = {
    module: {
        rules,
    },

    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    keep_classnames: true,
                    keep_fnames: true,
                    mangle: false,
                },
            }),
        ],
    },

    plugins: [
        ...plugins.rendererPlugins,
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'public/output.css'),
                    to: 'output.css',
                },
            ],
        }),
    ],
    target: 'electron-renderer',
    resolve: {
        alias: {
            Globals: path.resolve(__dirname, 'src/Globals/'),
            Assets: path.resolve(__dirname, 'src/Assets/'),
            Images: path.resolve(__dirname, 'src/Images/'),
            Pages: path.resolve(__dirname, 'src/Pages/'),
            Plugins: path.resolve(__dirname, 'src/Plugins/'),
            Styles: path.resolve(__dirname, 'src/Styles/'),
            Utils: path.resolve(__dirname, 'src/Utils/'),
        },
        fallback: {
            path: require.resolve('path-browserify'),
        },
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.jpg'],
    },
}
