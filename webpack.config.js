const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebPackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: {
        // JS 
        main: './src/index.js',
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].[hash].js',
        publicPath: '/build/',
        umdNamedDefine: true  
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ["babel-loader", "eslint-loader"],
                include: [path.resolve(__dirname, 'src')]
            },
            {
                test: /\.html$/,
                use: [
                    {
                        loader: "html-loader"
                    }
                ]
            },
            {
                test: /\.scss$/,
                // 1. postcss-loader turns the SCSS into normal CSS.
                // 2. css-loader turns the CSS into a JS module whose default
                //    export is a string containing the CSS, while also adding
                //    the images and fonts from CSS as Webpack inputs.
                // 3. MiniCssExtractPlugin turns that string into a separate asset.
                use: [
                    MiniCssExtractPlugin.loader,
                    // Translates CSS into CommonJS
                    'css-loader',
                    // Compiles postCSS to CSS
                    {
                        loader: 'postcss-loader',
                        options: {
                            config: {
                                path: './postcss.config.js',
                            },
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    // Translates CSS into CommonJS
                    'css-loader']
            },
            {
                test: /\.(gif|png|svg|ttf|woff|woff2|xml|ico)$/,
                // Use a content-based hash in the name so that we can set a long cache
                // lifetime for assets while still delivering changes quickly.
                oneOf: [
                    {
                        // Assets referenced in CSS files
                        issuer: /\.(scss|css)$/,
                        loader: 'file-loader',
                        options: {
                            name: '[name].[hash:7].[ext]',
                            outputPath: getImgOutputPath,
                            publicPath: function (url, resourcePath) {
                                // CSS image usages end up in the `bundles/[hash]` output
                                // directory, so we adjust the final path to navigate up
                                // twice.
                                const outputPath = getImgOutputPath(url, resourcePath);
                                return toPublicPath(path.join("../..", outputPath));
                            },
                        },
                    },
                    {
                        // Assets referenced in HTML and JS files
                        loader: 'file-loader',
                        options: {
                            name: '[name].[hash:7].[ext]',
                            outputPath: getImgOutputPath,
                            publicPath: function (url, resourcePath) {
                                const outputPath = getImgOutputPath(url, resourcePath);
                                return toPublicPath(outputPath);
                            },
                        },
                    },
                ],
            },
        ]
    },
    resolve: {
        alias: {
            // alias any requires to the react module to the one in our path,
            // otherwise we tend to get the react source included twice when
            // using `npm link` / `yarn link`.
            "react": path.resolve('./node_modules/react'),
            "react-dom": path.resolve('./node_modules/react-dom'),
        },
    },
    externals: {      
        // Don't bundle react or react-dom      
        react: {          
            commonjs: "react",          
            commonjs2: "react",          
            amd: "React",          
            root: "React"      
        },      
        "react-dom": {          
            commonjs: "react-dom",          
            commonjs2: "react-dom",          
            amd: "ReactDOM",          
            root: "ReactDOM"      
        }  
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebPackPlugin({
            hash: true,
            template: "./public/index.html",
            filename: "./index.html"
        }),
        new MiniCssExtractPlugin({
            filename: "style.[contenthash].css"
        }),
    ],
    devtool: 'source-map',
    devServer: {
        stats: {
            chunks: false
        }
    }
};


/**
 * Merge assets found via CSS and imports into a single tree, while also preserving
 * directories under `res`.
 *
 * @param {string} url The adjusted name of the file, such as `warning.1234567.svg`.
 * @param {string} resourcePath The absolute path to the source file with unmodified name.
 * @return {string} The returned paths will look like `img/warning.1234567.svg`.
 */
function getImgOutputPath(url, resourcePath) {
    const prefix = /^.*[/\\]res[/\\]/;
    const outputDir = path.dirname(resourcePath).replace(prefix, "");
    return path.join(outputDir, path.basename(url));
}

/**
 * Convert path to public path format, which always uses forward slashes, since it will
 * be placed directly into things like CSS files.
 *
 * @param {string} path Some path to a file.
 */
function toPublicPath(path) {
    return path.replace(/\\/g, '/');
}
