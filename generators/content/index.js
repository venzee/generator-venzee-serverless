'use strict';
const Generator = require( 'yeoman-generator' );
const path = require( 'path' );
const fs = require( 'fs-extra' );

const TMPL_PREFIX = 'TMPL_';


module.exports = class extends Generator{

  writing(){

    this.fs.copy(
      path.resolve( __dirname, '../../tools' ),
      this.destinationPath( 'tools' )
    );

    const dirContents
      = fs.readdirSync( this.templatePath() ); // eslint-disable-line no-sync

    dirContents
      .filter( x=>!x.startsWith( TMPL_PREFIX ) )
      .forEach( fileName=>fs.copySync( this.templatePath( fileName ), this.destinationPath( fileName ) ) ); // eslint-disable-line no-sync

    const config
      = this.fs.readJSON( this.destinationPath( 'package.json' ) );

    const tmplOptions
      = Object.assign( { name: 'venzee-serverless', description: '' }, config );

    dirContents
      .filter( x=>x.startsWith( TMPL_PREFIX ) )
      .forEach( fileName=>this.fs.copyTpl( this.templatePath( fileName ), this.destinationPath( fileName.replace( TMPL_PREFIX, '' ) ), tmplOptions ) ); // eslint-disable-line max-len

  }


};
