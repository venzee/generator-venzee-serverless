const path
 = require( 'path' );

const cloneDeep
  = require( 'lodash/cloneDeep' );

describe( 'The collectFunctionResourcePaths function', ()=>{

  it( 'should return falsy if no function definitions are found', ()=>{

    const collectFunctionDefinitions
      = require( '<tools>/build/collectFunctionResources/collectFunctionConfigurations' );

    expect( collectFunctionDefinitions() )
      .not.to.exist;

  } );

  it( 'should include function definitions listed in the "functions" array', ()=>{

    const pathToFunctionDefinition
      = path.join( '..', 'lib', 'some', 'relative', 'path' );

    const definition = {
      foo: {
        bar: 'baz'
      }
    };


    const functions = [
      pathToFunctionDefinition
    ];

    const collectFunctionResourcePaths = proxyquire( '<tools>/build/collectFunctionResources/collectFunctionConfigurations',{ // eslint-disable-line max-len
      '../loadResourceDefinition': sinon.spy( ( _, x )=>Object.assign( { definition }, x ) )
    } );


    const expected
      = cloneDeep( definition );

    const actual
      = collectFunctionResourcePaths( functions );

    expect( actual )
      .to.deep.equal( expected );

    expect( actual.foo.resource )
      .to.deep.equal( pathToFunctionDefinition );

  } );


} );
