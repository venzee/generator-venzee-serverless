import { format } from 'util';
import { ResourceFormatString } from '<tools>/build/compileServiceConfiguration';
import cloneDeep from 'lodash/cloneDeep';

describe( 'The tools/build/compileServiceConfiguration function', ()=>{

  it( 'should throw if called without a path input', ()=>{

    const compileServiceConfiguration
      = require( '<tools>/build/compileServiceConfiguration' );

    expect( ()=>compileServiceConfiguration() )
      .to.throw();

  } );

  it( 'should read in the config file at the path provided', ()=>{

    const mockServiceConfig
      = { service: 'someService', stepFunctions: [] };

    const mockPopulateServicePackages
      = sinon.spy( ()=>mockServiceConfig );

    const compileServiceConfiguration = proxyquire( '<tools>/build/compileServiceConfiguration', {
      './populateServicePackages': mockPopulateServicePackages
    } );

    const someServiceConfigPath
      = '<some_service_ns>/someServiceName';

    compileServiceConfiguration( someServiceConfigPath );

    expect( mockPopulateServicePackages )
      .to.have.been.calledWith( someServiceConfigPath );

  } );

  it( 'should fetch all function definitions for packages provided in the service config', ()=>{

    const State1 = 'State1';
    const State2 = 'State2';
    const Type   = 'Task';

    const mockResourcePath1
      = './lib/packages/some_services_folder/lib/functionDefinition1';

    const mockResourcePath2
      = './lib/packages/some_services_folder/lib/functionDefinition2';

    const stepFunctionKey
      = 'someStepFunctionKey';

    const mockStepFunction  = {
      [ stepFunctionKey ]: {
        definition: {
          States: {
            [ State1 ]: { Type, Resource: mockResourcePath1 },
            [ State2 ]: { Type, Resource: mockResourcePath2 }
          }
        }
      }
    };

    const mockServiceConfig = {
      service:       'someService',
      stepFunctions: [ mockStepFunction  ]
    };

    const mockFunctionsToPathsMap = [
      {
        resource: mockResourcePath1,
        paths:    [ [ State1, 'Resource' ] ]
      },
      {
        resource: mockResourcePath2,
        paths:    [ [ State2, 'Resource' ] ]
      }
    ];

    const mockMapFunctionResourcesToPaths
      = sinon.spy( ()=>mockFunctionsToPathsMap );

    const mockFunctionDefinition1 = {
      authenticate: {
        handler: 'lib/authenticate-slack/index.handler',
        name:    '${self:provider.stage}_devops_tools_authenticate',
        role:    'arn:aws:iam::${env:AWS_ACCOUNT_ID}:role/service-role/devops_tools_AuthenticatorRole'
      }
    };

    const mockFunctionDefinition2 = {
      testify: {
        handler: 'lib/testify/index.handler',
        name:    '${self:provider.stage}_devops_tools_testify',
        role:    'arn:aws:iam::${env:AWS_ACCOUNT_ID}:role/service-role/devops_tools_TestifierRole'
      }
    };

    const mockFunctionDefinitionMappedToPaths = [
      Object.assign(
        {},
        mockFunctionsToPathsMap[ 0 ],
        { definition: mockFunctionDefinition1 }
      ),
      Object.assign(
        {},
        mockFunctionsToPathsMap[ 1 ],
        { definition: mockFunctionDefinition2 }
      )
    ];


    const mockLoadFunctionResources
      = sinon.spy( ()=>mockFunctionDefinitionMappedToPaths );

    const compileServiceConfiguration = proxyquire( '<tools>/build/compileServiceConfiguration', {
      './populateServicePackages':     ()=>mockServiceConfig,
      './mapFunctionResourcesToPaths': mockMapFunctionResourcesToPaths,
      './loadFunctionResources':       mockLoadFunctionResources

    } );

    const someServiceConfigPath
      = '<some_service_ns>/someServiceName';

    const expected = Object.assign(
      {},
      mockFunctionDefinition1,
      mockFunctionDefinition2
    );

    const actual
      = compileServiceConfiguration( someServiceConfigPath ).functions;

    expect( mockMapFunctionResourcesToPaths )
      .to.have.been.calledWith( mockStepFunction[ stepFunctionKey ] );

    expect( mockLoadFunctionResources )
      .to.have.been.calledWith( mockFunctionsToPathsMap );

    expect( actual )
      .to.deep.equal( expected );

  } );

  it( 'should fetch all step function definitions for packages provided in the service config', ()=>{

    const SomeState = 'SomeState';
    const Type      = 'Task';

    const mockResourcePath
      = './lib/packages/some_services_folder/lib/functionDefinition';

    const stepFunctionKey
      = 'someStepFunctionKey';

    const mockStepFunction = {
      [ stepFunctionKey ]: {
        definition: {
          States: {
            [ SomeState ]: { Type, Resource: mockResourcePath }
          }
        }
      }
    };

    const mockServiceConfig = {
      service:       'someService',
      stepFunctions: [ mockStepFunction ]
    };

    const mockFunctionsToPathsMap = [
      {
        resource: mockResourcePath,
        paths:    [ [ SomeState, 'Resource' ] ]
      }
    ];

    const mockMapFunctionResourcesToPaths
      = sinon.spy( ()=>mockFunctionsToPathsMap );

    const mockFunctionKey
      = 'someFunctionKey';

    const mockFunctionDefinition = {
      [ mockFunctionKey ]: {
        handler: 'lib/authenticate-slack/index.handler',
        name:    '${self:provider.stage}_devops_tools_authenticate',
        role:    'arn:aws:iam::${env:AWS_ACCOUNT_ID}:role/service-role/devops_tools_AuthenticatorRole'
      }
    };

    const mockFunctionDefinitionMappedToPaths = [ Object.assign(
      {},
      mockFunctionsToPathsMap[ 0 ],
      { definition: mockFunctionDefinition }
    ) ];


    const mockLoadFunctionResources
      = sinon.spy( ()=>mockFunctionDefinitionMappedToPaths );

    const compileServiceConfiguration = proxyquire( '<tools>/build/compileServiceConfiguration', {
      './populateServicePackages':     ()=>mockServiceConfig,
      './mapFunctionResourcesToPaths': mockMapFunctionResourcesToPaths,
      './loadFunctionResources':       mockLoadFunctionResources

    } );

    const someServiceConfigPath
      = '<some_service_ns>/someServiceName';

    const expectedResource
      = format( ResourceFormatString, mockFunctionKey );

    const expected = {
      stateMachines: cloneDeep( mockStepFunction )
    };

    expected.stateMachines[ stepFunctionKey ].definition.States.SomeState.Resource
      = expectedResource;

    const actual
      = compileServiceConfiguration( someServiceConfigPath ).stepFunctions;

    expect( mockMapFunctionResourcesToPaths )
      .to.have.been.calledWith( mockStepFunction[ stepFunctionKey ] );

    expect( mockLoadFunctionResources )
      .to.have.been.calledWith( mockFunctionsToPathsMap );

    expect( actual )
      .to.deep.equal( expected );

  } );


  it( 'should combine function and stepFunction definitions with other defined properties', ()=>{

    const SomeState = 'SomeState';
    const Type      = 'Task';

    const mockResourcePath
      = './lib/packages/some_services_folder/lib/functionDefinition';

    const stepFunctionKey
      = 'someStepFunctionKey';

    const mockStepFunction = {
      [ stepFunctionKey ]: {
        definition: {
          States: {
            [ SomeState ]: { Type, Resource: mockResourcePath }
          }
        }
      }
    };

    const mockServiceConfig = {
      service:       'someService',
      stepFunctions: [ mockStepFunction ]
    };

    const mockFunctionsToPathsMap = [
      {
        resource: mockResourcePath,
        paths:    [ [ SomeState, 'Resource' ] ]
      }
    ];

    const mockMapFunctionResourcesToPaths
      = sinon.spy( ()=>mockFunctionsToPathsMap );

    const mockFunctionKey
      = 'someFunctionKey';

    const mockFunctionDefinition = {
      [ mockFunctionKey ]: {
        handler: 'lib/authenticate-slack/index.handler',
        name:    '${self:provider.stage}_devops_tools_authenticate',
        role:    'arn:aws:iam::${env:AWS_ACCOUNT_ID}:role/service-role/devops_tools_AuthenticatorRole'
      }
    };

    const mockFunctionDefinitionMappedToPaths = [ Object.assign(
      {},
      mockFunctionsToPathsMap[ 0 ],
      { definition: mockFunctionDefinition }
    ) ];


    const mockLoadFunctionResources
      = sinon.spy( ()=>mockFunctionDefinitionMappedToPaths );

    const compileServiceConfiguration = proxyquire( '<tools>/build/compileServiceConfiguration', {
      './populateServicePackages':     ()=>mockServiceConfig,
      './mapFunctionResourcesToPaths': mockMapFunctionResourcesToPaths,
      './loadFunctionResources':       mockLoadFunctionResources

    } );

    const someServiceConfigPath
      = '<some_service_ns>/someServiceName';

    const expectedResource
      = format( ResourceFormatString, mockFunctionKey );

    const expected = Object.assign(
      cloneDeep( mockServiceConfig ),
      {
        functions:     cloneDeep( mockFunctionDefinition ),
        stepFunctions: { stateMachines: cloneDeep( mockStepFunction ) }
      }
    );

    expected
      .stepFunctions
      .stateMachines[ stepFunctionKey ]
      .definition
      .States
      .SomeState
      .Resource = expectedResource;

    delete expected.packages;

    const actual
      = compileServiceConfiguration( someServiceConfigPath );

    expect( actual )
      .to.deep.equal( expected );


  } );

  it( 'should support multiple packages using', ()=>{

    const SomeState = 'SomeState';
    const Type      = 'Task';

    const mockResourcePath
      = './lib/packages/some_services_folder/lib/functionDefinition';

    const stepFunctionKey1
      = 'stepFunctionKey1';

    const mockStepFunction1 = {
      [ stepFunctionKey1 ]: {
        definition: {
          States: {
            [ SomeState ]: { Type, Resource: mockResourcePath }
          }
        }
      }
    };

    const stepFunctionKey2
      = 'stepFunctionKey2';

    const mockStepFunction2 = {
      [ stepFunctionKey2 ]: {
        definition: {
          States: {
            [ SomeState ]: { Type, Resource: mockResourcePath }
          }
        }
      }
    };

    const mockServiceConfig = {
      service:       'someService',
      stepFunctions: [ mockStepFunction1, mockStepFunction2 ]
    };

    const mockFunctionsToPathsMap = [
      {
        resource: mockResourcePath,
        paths:    [ [ SomeState, 'Resource' ] ]
      }
    ];

    const mockFunctionKey
      = 'someFunctionKey';

    const mockFunctionDefinition = {
      [ mockFunctionKey ]: {
        handler: 'lib/authenticate-slack/index.handler',
        name:    '${self:provider.stage}_devops_tools_authenticate',
        role:    'arn:aws:iam::${env:AWS_ACCOUNT_ID}:role/service-role/devops_tools_AuthenticatorRole'
      }
    };

    const mockFunctionDefinitionMappedToPaths = [ Object.assign(
      {},
      mockFunctionsToPathsMap[ 0 ],
      { definition: mockFunctionDefinition }
    ) ];


    const mockLoadFunctionResources
      = sinon.spy( ()=>mockFunctionDefinitionMappedToPaths );

    const compileServiceConfiguration = proxyquire( '<tools>/build/compileServiceConfiguration', {
      './populateServicePackages':     ()=>mockServiceConfig,
      './mapFunctionResourcesToPaths': ()=>mockFunctionsToPathsMap,
      './loadFunctionResources':       mockLoadFunctionResources

    } );

    const someServiceConfigPath
      = '<some_service_ns>/someServiceName';

    const expectedResource
      = format( ResourceFormatString, mockFunctionKey );

    const expected = Object.assign(
      cloneDeep( mockServiceConfig ),
      {
        functions:     cloneDeep( mockFunctionDefinition ),
        stepFunctions: {
          stateMachines: Object.assign( {}, ...[ mockStepFunction1, mockStepFunction2 ].map( cloneDeep ) )
        }
      }
    );


    [ stepFunctionKey1, stepFunctionKey2 ].forEach( key=>{

      expected
        .stepFunctions
        .stateMachines[ key ]
        .definition
        .States
        .SomeState
        .Resource = expectedResource;

    } );

    delete expected.packages;

    const actual
      = compileServiceConfiguration( someServiceConfigPath );

    expect( actual )
      .to.deep.equal( expected );

  } );

  it( 'should throw if duplicate step function keys are found', ()=>{

    const stepFunctionKey
      = 'stepFunctionKey';

    const mockStepFunction = { [ stepFunctionKey ]: {} };

    const mockServiceConfig = {
      service:       'someService',
      stepFunctions: [ mockStepFunction, mockStepFunction ]
    };

    const compileServiceConfiguration = proxyquire( '<tools>/build/compileServiceConfiguration', {
      './populateServicePackages': ()=>mockServiceConfig
    } );

    const someServiceConfigPath
      = '<some_service_ns>/someServiceName';


    expect( ()=>compileServiceConfiguration( someServiceConfigPath ) )
      .to.throw( `Duplicate Package key in '["${ stepFunctionKey }"]` );

  } );

} );
