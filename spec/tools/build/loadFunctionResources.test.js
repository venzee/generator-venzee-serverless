import path from 'path';

describe( 'The tools/build/loadFunctionResources function', ()=>{

  afterEach( ()=>mockfs.restore() );

  it( 'should fetch the resources of relative paths provided', ()=>{

    const loadFunctionResources
      = require( '<tools>/build/loadFunctionResources' );
    const definition
      = { someFunctionKey: { name: 'NameOfTheLambdaFunction' } };
    const relativePath
      = './someSubFolder/someFunctionFolder';
    const input
      = [ { resource: relativePath } ];
    const expected
      = [ Object.assign( { definition }, input[ 0 ] ) ];

    const mockfsConfig = {
      [ path.posix.join( __dirname, relativePath ) ]: {
        'function.json': JSON.stringify( definition )
      }
    };

    mockfs( mockfsConfig );

    const actual = loadFunctionResources( input, __filename );

    expect( actual ).to.deep.equal( expected );

  } );

  it( 'should fetch the resources of provided paths with a namespace', ()=>{

    const definition
      = { someFunctionKey: { name: 'NameOfTheLambdaFunction' } };
    const pathWithNameSpace
      = '<common>/someSubFolder/someFunctionFolder';

    const input
      = [ { resource: pathWithNameSpace } ];
    const expected
      = [ Object.assign( { definition }, input[ 0 ] ) ];

    const fsExtraStub
      =  { readJsonSync: sinon.spy( ()=>definition ) };

    const loadFunctionResources = proxyquire( '<tools>/build/loadFunctionResources', {
      'fs-extra':                fsExtraStub,
      '../util/expandNamespace': ()=>`./lib/common/${ pathWithNameSpace.split( '/' ).slice( 1 ).join( '/' ) }`
    } );

    const actual = loadFunctionResources( input, __filename );

    expect( actual )
      .to.deep.equal( expected );

    const expectedModulePath = path.posix.join(
      path.posix.normalize( process.cwd() ),
      'lib',
      'common',
      'someSubFolder',
      'someFunctionFolder',
      'function.json'
    );

    expect( fsExtraStub[ 'readJsonSync' ] )
      .to.have.been.calledWith( expectedModulePath );

  } );

} );
