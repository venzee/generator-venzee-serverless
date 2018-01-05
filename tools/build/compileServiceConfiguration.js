const assert
  = require( 'assert' );

const setValue
  = require( 'lodash/set' );

const cloneDeep
  = require( 'lodash/cloneDeep' );

const populateServicePackages
  = require( './populateServicePackages' );

const mapFunctionResourcesToPaths
  = require( './mapFunctionResourcesToPaths' );

const loadFunctionResources
  = require( './loadFunctionResources' );

const { format }
  = require( 'util' );

const ResourceFormatString
  = 'arn:aws:lambda:${self:provider.region}:${self:custom.accountId}:function:${self:functions.%s.name}';

function compileServiceConfiguration( configFilePath ){

  /* istanbul ignore next */ assert( configFilePath != null, 'path to config file is required' );

  const serviceConfiguration
    = populateServicePackages( configFilePath );

  const stepFunctions
    = serviceConfiguration.stepFunctions.reduce( applyStepFunctions, { stateMachines: {} } );

  const functions
    = serviceConfiguration.stepFunctions.reduce( applyStepFunctionFunctions, {} );

  Object
    .keys( functions )
    .forEach( updateStepFunctionResourceEntries.bind( functions, stepFunctions ) );

  const finalConfiguration
    = cloneDeep( serviceConfiguration );

  finalConfiguration.functions
    = cloneDeep( functions ); // get rid of all hidden properties

  finalConfiguration.stepFunctions
    = stepFunctions;

  delete finalConfiguration.packages;

  return finalConfiguration;

}


module.exports = compileServiceConfiguration;
module.exports.ResourceFormatString = ResourceFormatString;

function applyStepFunctionFunctions( functions, pkg ){

  const pkgKey
    = Object.keys( pkg )[ 0 ];

  const functionResourcesMappedToPaths
    = mapFunctionResourcesToPaths( pkg[ pkgKey ] );

  const packageFunctions = loadFunctionResources( functionResourcesMappedToPaths, __filename )
    .map( extendPaths.bind( null, pkgKey ) );

  return packageFunctions.reduce( applyFunctions, functions );

}

function extendPaths( pkgKey, resource ){

  const paths = resource.paths;
  const parents = [ 'stateMachines', pkgKey, 'definition', 'States' ];

  return Object.assign(
    {},
    resource,
    { paths: paths.map( path=>[ ...parents, ...path ] ) }
  );

}

function applyFunctions( functions, packageFunction ){

  const funcKey
    = Object.keys( packageFunction.definition )[ 0 ];

  const existingEntry
    = functions[ funcKey ];

  if( existingEntry ){

    existingEntry.paths.push( ...packageFunction.paths );
    return functions;

  }

  const newEntry
    = Object.assign( {}, packageFunction.definition[ funcKey ] );

  // we want to keep the resource and paths around, but we don't want them to be serialized
  // - creating 'hidden' properties to achieve this
  Object.defineProperties(
    newEntry,
    {
      resource: { value: packageFunction.resource, writable: false, enumerable: false },
      paths:    { value: [...packageFunction.paths ], writable: false, enumerable: false }
    }
  );

  functions[ funcKey ]
    = newEntry;

  return functions;

}

function applyStepFunctions( stepFunctions, pkg ){

  const stepFunctionKeys = Object.keys( pkg );
  /* istanbul ignore next */ assert( stepFunctionKeys.every( key=>!( key in stepFunctions.stateMachines ) ), `Duplicate Package key in '${ JSON.stringify( stepFunctionKeys )  }'`  ); // eslint-disable-line max-len, padding-line-between-statements

  Object.assign( stepFunctions.stateMachines, cloneDeep( pkg ) );
  return stepFunctions;

}

function updateStepFunctionResourceEntries( stepFunctions, functionKey ){

  const resourceARN
    = format( ResourceFormatString, functionKey );

  this[ functionKey ]
    .paths
    .forEach( objPath=>setValue( stepFunctions, objPath, resourceARN ) );

}
