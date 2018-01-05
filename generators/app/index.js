'use strict';
const Generator = require( 'yeoman-generator' );
const chalk = require( 'chalk' );
const yosay = require( 'yosay' );

module.exports = class extends Generator{

  initializing(){

    this.composeWith( require.resolve( '../npm' ) );
    this.composeWith( require.resolve( '../content' ) );
    this.composeWith( require.resolve( 'generator-license' ), {
      name:    'Venzee, Inc.',
      email:   'admin@venzee.com',
      website: 'https://venzee.com'
    } );

  }


  prompting(){

    this.log( yosay( `Let's set up a new ${ chalk.red( 'Venzee Serverless' ) } project` )  );

  }

};


