'use strict';
const Generator = require( 'yeoman-generator' );
const chalk = require( 'chalk' );
const yosay = require( 'yosay' );

module.exports = class extends Generator{

  initializing(){

    this.composeWith( require.resolve( '../npm' ) );
    this.composeWith( require.resolve( '../content' ) );

  }


  prompting(){

    this.log( yosay( `Let's set up a new ${ chalk.red( 'Venzee Serverless' ) } project` )  );

  }

};
