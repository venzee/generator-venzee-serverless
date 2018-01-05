'use strict';
const Generator = require( 'yeoman-generator' );
const path = require( 'path' );
const fs = require( 'fs' );

const TMPL = '.tmpl';


module.exports = class extends Generator{

  writing(){

    this.fs.copy(
      path.resolve( __dirname, '../../tools' ),
      this.destinationPath( 'tools' )
    );

    const dirContents
      = fs.readdirSync( this.templatePath() ); // eslint-disable-line no-sync

    dirContents
      .filter( x=>path.extname( x ) !== TMPL )
      .forEach( fileName=>this.fs.copy( this.templatePath( fileName ), this.destinationPath( fileName ) ) );

    const config
      = this.fs.readJSON( this.destinationPath( 'package.json' ) );

    const tmplOptions
      = Object.assign( { name: 'venzee-serverless', description: '' }, config );

    dirContents
      .filter( x=>path.extname( x ) === TMPL )
      .forEach( fileName=>this.fs.copyTpl( this.templatePath( fileName ), this.destinationPath( path.basename( fileName, TMPL ) ), tmplOptions ) ); // eslint-disable-line max-len

  }


};
