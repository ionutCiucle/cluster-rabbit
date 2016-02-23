module.exports = {
  entry: './public/js/index.js',
  output: {
    path: __dirname+'/static/js',
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader'
      }
    ]
  }
};
