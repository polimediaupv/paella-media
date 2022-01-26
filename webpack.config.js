const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = function (env) {
    const mediaServer = env.server || 'https://media.upv.es';
    const proxyOpts = {
        target: mediaServer,
        secure: false,
        changeOrigin: true
    };

    return {
        entry: './src/index.js',
        output: {
            path: path.join(__dirname, "dist"),
            filename: 'paella-player-media.js',
            sourceMapFilename: 'paella-player-media.js.map'
        },
        devtool: 'source-map',
        devServer: {
            port: 8080,
            allowedHosts: 'all',
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
            },
            proxy: {
                '/player': {
                    target: 'http://localhost:8080',
                    pathRewrite: {
                        '/player': ''
                    }
                },
                '/**': proxyOpts,
                '/index.html': proxyOpts
                //'/rest/paella/auth/**': proxyOpts,
                //'/rest/plugins/**': proxyOpts,
                //'/rest/paella/**': proxyOpts
            }
        },
        
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules)/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                },

                {
                    test: /\.js$/,
                    enforce: 'pre',
                    use: ['source-map-loader']
                },

                {
                    test: /\.css$/,
                    use:  [
                        'style-loader',
                        'css-loader'
                    ]
                },

                {
                    test: /\.svg$/i,
                    use: {
                        loader: 'svg-inline-loader'
                    }
                },
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader']
                }
            ]
        },
        
        plugins: [
            new HtmlWebpackPlugin({
                template: 'src/index.html',
                inject: true
            }),
            new CopyWebpackPlugin({
                patterns: [
                    { from: './config', to: 'config' },
                    { from: './repository_test/repository', to: 'repository' },
                    { from: './src/style.css', to: '' }
                ]
            })
        ],

        performance: {
            hints: false,
            maxEntrypointSize: 1048576,
            maxAssetSize: 1048576
        }
    };
}
