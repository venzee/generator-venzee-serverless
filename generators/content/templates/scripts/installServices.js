// #!/usr/bin/env node
/* eslint-disable no-console, no-sync */

const path
  = require( 'path' );

const glob
  = require( 'glob' ).sync;

const fs
  = require( 'fs-extra' );

const yml
  = require( 'js-yaml' );

const CoverallsDefaultService = Object.freeze( {
  coveralls: {
    build:              { image: 'venzee/coveralls', dockerfile: '.coveralls.dockerfile' },
    encrypted_env_file: '.deploy/coveralls-credentials.encrypted',
    cached:             true
  }
} );

const DefaultSteps = Object.freeze( [
  {
    name:    'lint',
    service: 'coveralls',
    command: 'eslint .'
  },
  {
    name:    'push to coveralls',
    service: 'coveralls',
    command: 'npm run push_to_coveralls'
  }
] );

const DeploymentStages = Object.freeze( [
  'dev', 'production', 'qa', 'sandbox'
] );

const ConfigFiles = Object.freeze( {
  Steps:    path.resolve( __dirname, path.join( '..', 'codeship-steps.yml' ) ),
  Services: path.resolve( __dirname, path.join( '..', 'codeship-services.yml' ) ),
  Package:  path.resolve( __dirname, path.join( '..', 'package.json' ) )

} );

function installServices(){

  const serviceNames = glob( 'lib/services/*/index.json', { cwd: path.resolve( __dirname, '..' ) } )
    .map( servicePath=>path.basename( path.dirname( servicePath ) ) );

  const currentCodeshipSteps
    = loadCodeshipConfig( ConfigFiles.Steps, DefaultSteps );

  const servicesWithoutDefinedSteps = serviceNames.filter(
    serviceName=>currentCodeshipSteps.find( ( { name } )=>name.startsWith( serviceName ) ) == null
  );

  if( servicesWithoutDefinedSteps.length === 0 ) return console.info( 'No new services found...' );

  console.info( `Installing service${
    servicesWithoutDefinedSteps.length > 1 ? 's' : '' }${
    servicesWithoutDefinedSteps.join( '\n' ) }`
  );

  const newCodeshipServices = servicesWithoutDefinedSteps.reduce(
    ( acc, serviceName )=>Object.assign( acc, createServiceEntriesFor( serviceName ) ),
    {}
  );

  const currentCodeshipServices
    = loadCodeshipConfig( ConfigFiles.Services, CoverallsDefaultService );

  const combinedCodeshipServices
    = Object.assign( {}, newCodeshipServices, currentCodeshipServices );

  saveCodeshipConfig( ConfigFiles.Services, combinedCodeshipServices );

  const newCodeshipStepEntries = servicesWithoutDefinedSteps
    .map( createStepEntriesFor )
    .reduce( ( acc, entries )=>[ ...acc, ...entries ], [] );

  const combinedCodeshipStepEntries = [
    ...currentCodeshipSteps,
    ...newCodeshipStepEntries
  ];

  saveCodeshipConfig( ConfigFiles.Steps, combinedCodeshipStepEntries );

  const newNpmCommands = serviceNames.reduce(
    ( acc, serviceName )=>Object.assign( acc, createNpmCommandsFor( serviceName ) ),
    {}
  );

  const packageDef
    = fs.readJSONSync( ConfigFiles.Package );

  const currentNpmCommands
    = packageDef.scripts;

  const combinedNpmCommands
    = Object.assign( {}, currentNpmCommands, newNpmCommands );

  packageDef.scripts
    = combinedNpmCommands;

  fs.writeJSONSync( ConfigFiles.Package, packageDef, { spaces: 2 }  );

}

module.exports = installServices;

function loadCodeshipConfig( filePath, defaultIfNone ){

  try {

    return yml.safeLoad( fs.readFileSync( filePath ,'utf8' ) );

  } catch( err ){

    if( err.code === 'ENOENT' ) return defaultIfNone;
    throw( err );

  }

}

function saveCodeshipConfig( filePath, config ){

  fs.writeFileSync( filePath, yml.safeDump( config ) );

}

function createServiceEntriesFor( serviceName ){

  return DeploymentStages.reduce(
    ( acc, deploymentStage )=>{

      const entryName
          = `${ serviceName }_${ deploymentStage }`;

      const entry = {
        [ entryName ]: {
          build:              { image: `venzee/${ entryName }`, dockerfile: '.service.dockerfile', args: { SERVICE_NAME: serviceName } }, // eslint-disable-line max-len
          environment:        [ `DEPLOYMENT_STAGE=${ deploymentStage }` ],
          encrypted_env_file: '.deploy/env.encrypted',
          cached:             true,
          volumes:            [ './.deploy:/deploy' ]
        }
      };

      return Object.assign( acc, entry );

    }, {} );

}

function createStepEntriesFor( serviceName ){

  return DeploymentStages.map( deploymentStage=>{

    const entryName
          = `${ serviceName }_${ deploymentStage }`;

    return {
      type:    'serial',
      name:    entryName,
      service: entryName,
      steps:   [
        {
          name:    `${ entryName }: build only`,
          command: `npm run ${ entryName }_build`,
          tag:     `^${ serviceName }\\((${ deploymentStage }-build-v\\d+\\.\\d+.\\d+)\\)$`
        },
        {
          name:    `${ entryName }: build and deploy`,
          command: `npm run ${ entryName }_deploy`,
          tag:     `^${ serviceName }\\((${ deploymentStage }-v\\d+\\.\\d+.\\d+)\\)$`
        }
      ]
    };

  }, {} );

}

function createNpmCommandsFor( serviceName ){

  /* eslint-disable max-len */
  const serviceCommon = {
    [ `${ serviceName }_generate_service_yml` ]: `node scripts/build.js ./lib/services/${ serviceName }`,
    [ `${ serviceName }_generate_package` ]:     `cd lib/services/${ serviceName } && serverless package --package /deploy/${ serviceName }`
  };

  const stageSpecific = DeploymentStages.reduce(
    ( acc, deploymentStage )=>{

      const entryName
          = `${ serviceName }_${ deploymentStage }`;

      const stageEnvKey
        = deploymentStage.toUpperCase();

      const entry = {
        [ `${ entryName }_build` ]:  `cross-env-shell AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID_${ stageEnvKey } AWS_REGION=$AWS_REGION_${ stageEnvKey } "npm run devops_tools_generate_service_yml && npm run devops_tools_generate_package"`,
        [ `${ entryName }_deploy` ]: `cross-env-shell AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID_${ stageEnvKey } AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY_${ stageEnvKey } AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID_${ stageEnvKey } AWS_REGION=$AWS_REGION_${ stageEnvKey } "npm run ${ serviceName }_generate_service_yml && npm run ${ serviceName }_generate_package && cd lib/services/${ serviceName } && serverless deploy --verbose --package /deploy/${ serviceName }"`,
      };

      return Object.assign( acc, entry );

    }, {} );

  /* eslint-enable max-len */

  return Object.assign( {}, serviceCommon, stageSpecific );

}

if( require.main === module ) installServices( require( 'optimist' ).argv );
