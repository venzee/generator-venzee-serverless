const fs       = require( 'fs-extra' );
const path     = require( 'path' );
const isObject = require( 'lodash/isObject' );
const isString = require( 'lodash/isString' );

const expandNamespace = require( '../util/expandNamespace' );

const JsonExtension   = '.json';
const PackageMainFile = 'index.json';

function populateServicePackagePaths( pathToServiceDefinition ){

  pathToServiceDefinition = path.extname( pathToServiceDefinition ) === JsonExtension
    ? pathToServiceDefinition
    : `${ pathToServiceDefinition }${ JsonExtension }`;

  const expandedPath
    = expandNamespace( pathToServiceDefinition, process.cwd() );

  const serviceDefinition
    = fs.readJsonSync( expandedPath ); // eslint-disable-line no-sync

  const stepFunctions
    = serviceDefinition.stepFunctions;

  try {

    return Object.assign( {}, serviceDefinition, { stepFunctions: stepFunctions.map( mapStepFunctions ) } );

  } catch( err ){

    throw new Error( `Error while processing service at '${ pathToServiceDefinition }': ${ err.message }` );

  }

}

module.exports = populateServicePackagePaths;

function mapStepFunctions( pkg, index ){

  if( isObject( pkg ) ) return pkg;
  if( !isString( pkg ) ) /* istanbul ignore next */ throw new Error( `Expected either a string or an object for package at index ${ index }, got ${ typeof pkg }.` ); // eslint-disable-line max-len

  const expandedPackagePath
    = expandNamespace( pkg, process.cwd() );

  const fullPath = expandedPackagePath.endsWith( PackageMainFile )
    ? expandedPackagePath
    : path.join( expandedPackagePath, PackageMainFile );

  return fs.readJsonSync( fullPath ); // eslint-disable-line no-sync

}
