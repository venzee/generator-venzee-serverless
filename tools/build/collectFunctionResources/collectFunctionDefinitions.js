const applyFunctionDefinition
  = require( '../applyFunctionDefinition' );

const loadResourceDefinition
  = require( '../loadResourceDefinition' );

/**
 *
 * An array of strings, each representing a path to a JSON file, expected to
 * describe a Serverless Function configuration.
 * @typedef {String[]} FunctionConfigurationPaths
 *
*/

/**
 * @typedef {Object} FunctionConfigurationProperties
 *
 * @property {String} handler
 *   handler set in AWS Lambda
 * @property {String} [name]
 *   [optional] Deployed Lambda name
 * @property {String} [description]
 *   [optional], Description to publish to provider
 * @property {String} [runtime]
 *   [optional] overwrite, default is provider runtime
 * @property {Number} [memorySize]
 *   [optional] in MB, default is 1024
 * @property {Number} [timeout]
 *   [optional] in seconds, default is 6
 *
*/

/**
 * A dictionary that maps Serverless function properties to keys used by the
 * Serverless framework to identify the function instances
 * @typedef {Object.<string, FunctionConfigurationProperties} FunctionConfiguration
 *
 * @see {@link https://serverless.com/framework/docs/providers/aws/guide/functions}
*/

/**
 * Iterate over an array off FunctionConfigurationPaths paths, loading the
 * configuration from each file
 *
 * @param {FunctionConfigurationPaths} functionConfigurationPaths
 *   The array of paths to iterate over
 * @returns {FunctionConfiguration}
 *   A dictionary of all function definitions found at the listed locations
 */
function collectFunctionDefinitions( functionConfigurationPaths ){

  if( functionConfigurationPaths == null ) return;

  // make simple functions look like step function resources
  const resourceObjects
    = functionConfigurationPaths.map( resource=>( { resource } ) );

  return resourceObjects
    .map( loadResourceDefinition.bind( null, __dirname ) )
    .reduce( applyFunctionDefinition, {} );

}

module.exports = collectFunctionDefinitions;

