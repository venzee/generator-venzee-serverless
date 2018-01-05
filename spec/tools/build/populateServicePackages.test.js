import path from 'path';

describe( 'The tools/build/populateServicePackages function', ()=>{

  it( 'should load packages defined with namespaces', ()=>{

    const definition
      = { service: 'SomeService', stepFunctions: [ '<devops_tools_stepFunctions>/listTeamMembers' ] };

    const input
      = '<devops_tools_services>/devops_tools';

    const mockStepFunction
      = { name: 'some package Data - we are mocking and the uit does not validate' };

    const expected
      = Object.assign( {}, definition, { stepFunctions: [ mockStepFunction ] } );

    const expandedServicePath = path.join(
      '..',
      'lib',
      'packages',
      'devops_services',
      'services',
      'devops_tools.json'
    ).slice( 1 );

    const expandedPackagePath = path.join(
      '..',
      'lib',
      'packages',
      'devops_services',
      'packages',
      'listTeamMembers'
    ).slice( 1 );

    const mockExpandResults = {
      [ `${ input }.json` ]:             expandedServicePath,
      [ definition.stepFunctions[ 0 ] ]: expandedPackagePath
    };

    const packageMainFilePath
      = path.join( expandedPackagePath, 'index.json' );

    const mockReadResults = {
      [ expandedServicePath ]: definition,
      [ packageMainFilePath ]: mockStepFunction
    };

    const fsExtraStub
      = { readJsonSync: sinon.spy( path=>mockReadResults[ path ] ) };

    const expandNamespaceStub
      = sinon.spy( path=>mockExpandResults[ path ] );

    const populateServicePackages = proxyquire( '<tools>/build/populateServicePackages', {
      'fs-extra':                fsExtraStub,
      '../util/expandNamespace': expandNamespaceStub
    } );

    const actual = populateServicePackages( input );

    expect( actual )
      .to.deep.equal( expected );

    expect( fsExtraStub[ 'readJsonSync' ] )
      .to.have.been.calledWith( expandedServicePath );

    expect( fsExtraStub[ 'readJsonSync' ] )
      .to.have.been.calledWith( packageMainFilePath );

  } );

  it( 'should support full package paths', ()=>{

    const packageMainFilePath = path.join(
      '..',
      'lib',
      'packages',
      'devops_services',
      'packages',
      'listTeamMembers',
      'index.json'
    ).slice( 1 );

    const definition
      = { service: 'SomeService', stepFunctions: [ packageMainFilePath ] };

    const input
      = '<devops_tools_services>/devops_tools';

    const mockStepFunction
      = { name: 'some package Data - we are mocking and the uit does not validate' };

    const expected
      = Object.assign( {}, definition, { stepFunctions: [ mockStepFunction ] } );

    const expandedServicePath = path.join(
      '..',
      'lib',
      'packages',
      'devops_services',
      'services',
      'devops_tools.json'
    ).slice( 1 );

    const mockExpandResults = {
      [ `${ input }.json` ]:             expandedServicePath,
      [ definition.stepFunctions[ 0 ] ]: definition.stepFunctions[ 0 ]
    };

    const mockReadResults = {
      [ expandedServicePath ]: definition,
      [ packageMainFilePath ]: mockStepFunction
    };

    const fsExtraStub
      = { readJsonSync: sinon.spy( path=>mockReadResults[ path ] ) };

    const expandNamespaceStub
      = sinon.spy( path=>mockExpandResults[ path ] );

    const populateServicePackages = proxyquire( '<tools>/build/populateServicePackages', {
      'fs-extra':                fsExtraStub,
      '../util/expandNamespace': expandNamespaceStub
    } );

    const actual = populateServicePackages( input );

    expect( actual )
      .to.deep.equal( expected );

    expect( fsExtraStub[ 'readJsonSync' ] )
      .to.have.been.calledWith( expandedServicePath );

    expect( fsExtraStub[ 'readJsonSync' ] )
      .to.have.been.calledWith( packageMainFilePath );

  } );

  it( 'should support pre-populated service files', ()=>{

    const mockStepFunction
      = { name: 'some package Data - we are mocking and the uit does not validate' };

    const definition
      = { service: 'SomeService', stepFunctions: [ mockStepFunction ] };

    const input
      = '<devops_tools_services>/devops_tools';

    const expected
      = Object.assign( {}, definition, { stepFunctions: [ mockStepFunction ] } );

    const expandedServicePath = path.join(
      '..',
      'lib',
      'packages',
      'devops_services',
      'services',
      'devops_tools.json'
    ).slice( 1 );

    const mockExpandResults = {
      [ `${ input }.json` ]: expandedServicePath
    };

    const mockReadResults = {
      [ expandedServicePath ]: definition
    };

    const fsExtraStub
      = { readJsonSync: sinon.spy( path=>mockReadResults[ path ] ) };

    const expandNamespaceStub
      = sinon.spy( path=>mockExpandResults[ path ] );

    const populateServicePackages = proxyquire( '<tools>/build/populateServicePackages', {
      'fs-extra':                fsExtraStub,
      '../util/expandNamespace': expandNamespaceStub
    } );

    const actual = populateServicePackages( input );

    expect( actual )
      .to.deep.equal( expected );

    expect( fsExtraStub[ 'readJsonSync' ] )
      .to.have.been.calledWith( expandedServicePath );

  } );

  it( 'should support input paths with json extensions', ()=>{

    const mockStepFunction
      = { name: 'some package Data - we are mocking and the uit does not validate' };

    const definition
      = { service: 'SomeService', stepFunctions: [ mockStepFunction ] };

    const input
      = '<devops_tools_services>/devops_tools.json';

    const expected
      = Object.assign( {}, definition, { stepFunctions: [ mockStepFunction ] } );

    const expandedServicePath = path.join(
      '..',
      'lib',
      'packages',
      'devops_services',
      'services',
      'devops_tools.json'
    ).slice( 1 );

    const mockExpandResults = {
      [ input ]: expandedServicePath
    };

    const mockReadResults = {
      [ expandedServicePath ]: definition
    };

    const fsExtraStub
      = { readJsonSync: sinon.spy( path=>mockReadResults[ path ] ) };

    const expandNamespaceStub
      = sinon.spy( path=>mockExpandResults[ path ] );

    const populateServicePackages = proxyquire( '<tools>/build/populateServicePackages', {
      'fs-extra':                fsExtraStub,
      '../util/expandNamespace': expandNamespaceStub
    } );

    const actual = populateServicePackages( input );

    expect( actual )
      .to.deep.equal( expected );

    expect( fsExtraStub[ 'readJsonSync' ] )
      .to.have.been.calledWith( expandedServicePath );

  } );

  it( 'should support package paths relative to the project root', ()=>{

    const mockStepFunction
      = { name: 'some package Data - we are mocking and the uit does not validate' };

    const definition
      = { service: 'SomeService', stepFunctions: [ mockStepFunction ] };

    const expected
      = Object.assign( {}, definition, { stepFunctions: [ mockStepFunction ] } );

    const input = path.join(
      '..',
      'lib',
      'packages',
      'devops_services',
      'services',
      'devops_tools'
    ).slice( 1 );

    const expandedServicePath
      = `${ input }.json`;

    const mockExpandResults = {
      [ expandedServicePath ]: expandedServicePath
    };

    const mockReadResults = {
      [ expandedServicePath ]: definition
    };

    const fsExtraStub
      = { readJsonSync: sinon.spy( path=>mockReadResults[ path ] ) };

    const expandNamespaceStub
      = sinon.spy( path=>mockExpandResults[ path ] );

    const populateServicePackages = proxyquire( '<tools>/build/populateServicePackages', {
      'fs-extra':                fsExtraStub,
      '../util/expandNamespace': expandNamespaceStub
    } );

    const actual = populateServicePackages( input );

    expect( actual )
      .to.deep.equal( expected );

    expect( fsExtraStub[ 'readJsonSync' ] )
      .to.have.been.calledWith( expandedServicePath );

  } );

  it( 'should throw if an invalid package entry is provided', ()=>{

    const invalidPackageEntry
      = 1;

    const definition
      = { service: 'SomeService', stepFunctions: [ invalidPackageEntry ] };

    const input
      = '<devops_tools_services>/devops_tools';

    const expandedServicePath = path.join(
      '..',
      'lib',
      'packages',
      'devops_services',
      'services',
      'devops_tools.json'
    ).slice( 1 );

    const inputFilePathKey
      = `${ input }.json`;

    const mockExpandResults = {
      [ inputFilePathKey ]: expandedServicePath
    };

    const mockReadResults = {
      [ expandedServicePath ]: definition
    };

    const fsExtraStub
      = { readJsonSync: sinon.spy( path=>mockReadResults[ path ] ) };

    const populateServicePackages = proxyquire( '<tools>/build/populateServicePackages', {
      'fs-extra':                fsExtraStub,
      '../util/expandNamespace': path=>mockExpandResults[ path ]
    } );

    const expected
      = `Error while processing service at '${ inputFilePathKey }': `
      + 'Expected either a string or an object for package at index 0, got number';

    expect( ()=>populateServicePackages( input ) )
      .to.throw( expected );

    expect( fsExtraStub[ 'readJsonSync' ] )
      .to.have.been.calledWith( expandedServicePath );

  } );

} );
