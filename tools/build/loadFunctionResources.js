const path = require( 'path' );
const expandNamespace = require( '../util/expandNamespace' );
const fs = require( 'fs-extra' );

const FunctionDefinitionFileName
  = 'function.json';

function loadFunctionResources( resourcesMap, callerPath ){

  return resourcesMap
    .map( loadResourceDefinition.bind( null, path.dirname( callerPath ) ) );

}

module.exports = loadFunctionResources;

function loadResourceDefinition( callerPath, resourceMappedToPaths ){


  const resourcePath = resourceMappedToPaths.resource;

  const packagePath = isRelativePath( resourcePath )
    ? path.join( callerPath, resourcePath )
    : path.join( process.cwd(), expandNamespace( resourcePath, process.cwd() ) );

  const filePath
    = path.join( packagePath, FunctionDefinitionFileName );

  const definition
    = fs.readJsonSync( filePath ); // eslint-disable-line no-sync

  return Object.assign( { definition }, resourceMappedToPaths );

}

function isRelativePath( pathToCheck ){

  return pathToCheck.startsWith( '.' );

}
