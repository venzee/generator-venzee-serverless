const last
  = require( 'lodash/last' );

const values
  = require( 'lodash/values' );

const ParallelStateTypeId
  = 'Parallel';

const NonResourceBasedStateTypeIds = Object.freeze( [
  'Pass',
  'Choice',
  'Wait',
  'Succeed',
  'Fail'
] );


function getFunctionPaths( stepFunctionDefinitions ){

  const states = stepFunctionDefinitions.definition.States;

  const statesMappedToResources = Object
    .keys( states )
    .reduce( ( acc, key )=>mapToResource( states, acc, [ key ] ), {} );

  return values( statesMappedToResources );

}

module.exports = getFunctionPaths;

function mapToResource( states, statesByResources, pathToState ){

  const stateKey  = last( pathToState );
  const stateType = states[ stateKey ].Type;

  if( stateType === ParallelStateTypeId ) return mapParallelStates( states, statesByResources, pathToState );
  if( NonResourceBasedStateTypeIds.includes( stateType ) ) return statesByResources;

  const resourceKey = states[ stateKey ].Resource;
  if( isActivityResource( resourceKey ) ) return statesByResources;

  const resourceStatesMapping
    = statesByResources[ resourceKey ]
    = statesByResources[ resourceKey ] || { resource: resourceKey, paths: [] };

  resourceStatesMapping.paths.push( [ ...pathToState, 'Resource' ] );

  return statesByResources;

}

function isActivityResource( resource ){

  return /:activity:[^:]+/gm.test( resource );

}

function mapParallelStates( rootStates, statesByResources, pathToState ){

  const thisStateKey
    = last( pathToState );

  const thisState
    = rootStates[ thisStateKey ];

  const branches
    = thisState.Branches;

  const pathToBranches = [
    ...pathToState,
    'Branches'
  ];

  return branches.reduce(
    ( acc, branch, index )=>mapBranchStates( [ ...pathToBranches, index ], acc, branch ), statesByResources );

}

function mapBranchStates( pathToBranches, statesByResources, { States } ){

  const pathToStates = [
    ...pathToBranches,
    'States'
  ];

  return Object
    .keys( States )
    .reduce( ( acc, key )=>mapToResource( States, acc, [ ...pathToStates, key] ), statesByResources );

}
