describe( 'The tools/util/expandNamespaces function', ()=>{

  it( 'should keep paths without namespaces unchanged', ()=>{

    const expandNamespaces
      = require( '<tools>/util/expandNamespace' );

    const expected = './somePath';
    const actual = expandNamespaces( expected );

    expect( actual ).to.equal( actual );

  } );

  it( 'should expand a known namespace to a path relative to the calling module', ()=>{

    const path
      = require( 'path' );

    const commonNamespace
      = './lib/common';

    const modulePath
      = 'some/module/path';

    const expected = path.relative(
      __dirname,
      path.join( process.cwd(), commonNamespace, modulePath )
    );

    const expandNamespaces = proxyquire( '<tools>/util/expandNamespace', {
      './loadNamespaces': ()=>( { namespaces: { common: commonNamespace } } )
    } );

    try {

      const actual
        = expandNamespaces( `<common>/${ modulePath }`, __dirname );

      expect( actual ).to.equal( expected );

    } finally {

      mockfs.restore();

    }

  } );

} );
