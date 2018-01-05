#!/usr/bin/env node
/* eslint-disable no-console, no-sync */

const path
  = require( 'path' );

const fs
  = require( 'fs-extra' );

const last
  = require( 'lodash/last' );

const isString
  = require( 'lodash/isString' );

const isEmpty
  = require( 'lodash/isEmpty' );

const compileServiceConfiguration
  = require( '../tools/build/compileServiceConfiguration' );

const usageString
  = 'Usage: build [--dry-run] ./path/to/serviceDefinitionFile.json';

const { safeDump }
  = require( 'js-yaml' );

const ServerlessConfigFileName
  = 'serverless.yml';

const WebpackConfigFileName
  = 'webpack.config.js';

const DefaultDefinitionName
  = 'index.json';

const WebpackConfigFilePath
  = path.resolve( __dirname, '../tools/build/baseConfigurations/webpack.config.js' );

function build( args ){

  const pathToServiceDefinitionFile
    = getServiceDefinitionFilePath( args._.length ? last( args._ ) : args[ 'dry-run' ] );

  if( !isString( pathToServiceDefinitionFile ) ) return printUsage( 'Missing path to service definition file' );

  const isDryRun
    = !!args[ 'dry-run' ];

  const serviceRootPath
    = path.dirname( pathToServiceDefinitionFile );

  generateServerlessConfig( pathToServiceDefinitionFile, isDryRun, serviceRootPath );
  ensureWebpackConfigExists( serviceRootPath );

}

module.exports = build;

function printUsage( err ){

  if( err != null ) console.error( err );
  console.info( usageString );

}

function generateServerlessConfig( pathToServiceDefinitionFile, isDryRun, serviceRootPath ){

  const serviceConfiguration
    = compileServiceConfiguration( pathToServiceDefinitionFile );

  Object.assign( serviceConfiguration, require( '../tools/build/baseConfigurations/aws' ) );

  const ymlOutput
    = safeDump( serviceConfiguration );

  if( isDryRun ) return console.info( ymlOutput );

  const serviceConfigFilePath
    = path.join( serviceRootPath, ServerlessConfigFileName );

  fs.writeFileSync( serviceConfigFilePath, ymlOutput );

}

function ensureWebpackConfigExists( serviceRootPath ){

  const configFilePath
    = path.join( serviceRootPath, WebpackConfigFileName );

  try {

    fs.copySync( WebpackConfigFilePath, configFilePath );

  } catch( err ){

    if( err.code === 'EEXIST' ) return console.info( `${ configFilePath } found, completing build...` );
    throw new Error( err );

  }

  console.info( `Copied ${ WebpackConfigFilePath } to service root folder at ${ serviceRootPath }` );

}

function getServiceDefinitionFilePath( candidatePath ){

  if( isEmpty( candidatePath ) ) return candidatePath;

  try{

    if( fs.statSync( candidatePath ).isFile() ) return candidatePath;

    const extendedPath
      = path.join( candidatePath, DefaultDefinitionName );

    if( fs.statSync( extendedPath ).isFile() ) return extendedPath;

  } catch( err ){

    if( err.code !== 'ENOENT' ) throw( err );

  }

  throw new Error( `Service definition not found at '${ candidatePath }'` );

}

if( require.main === module ) build( require( 'optimist' ).argv );
