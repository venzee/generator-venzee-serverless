const path
  = require( 'path' );
const slsw
  = require( 'serverless-webpack' );
const { namespaces }
  = require( '../../../tools/util/loadNamespaces' )();

const alias = Object
  .keys( namespaces )
  .reduce( ( aliases, key )=>Object.assign( aliases, { [ `<${ key }>` ]: resolve( namespaces[ key ] ) } ), {} ); // eslint-disable-line max-len

module.exports = {
  entry:     slsw.lib.entries,
  target:    'node',
  externals: [
    'aws-sdk'
  ],
  resolve: {
    modules: [
      resolve( 'node_modules' )
    ],
    alias
  },
  module: {
    rules: [
      {
        test:    /\.js$/,
        exclude: /node_modules/,
        loader:  'babel-loader',
        options: {
          babelrc: false
        }
      }
    ]
  }
};


function resolve( pathRelativeToRoot ){

  return path.resolve( __dirname, `../../../${ pathRelativeToRoot }` );

}
