module.exports = {
  presets: [[
    require( 'babel-preset-env' ), { targets: { node: "6.10" } }
  ]],
  plugins: [
    [ require( 'babel-plugin-namespaces' ).default, require( './tools/util/loadNamespaces' )() ]
  ],
};
