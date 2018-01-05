'use strict';
const Generator = require( 'yeoman-generator' );
const path = require( 'path' );


/* eslint-disable max-len */
const BasePackage = Object.freeze( {
  name:        null,
  version:     null,
  description: 'This repository contains resource definitions for Serverless services, such as Lambda function, Step Functions, etc.',
  author:      'Venzee, Inc.',
  private:     true,
  license:     'UNLICENSED',
  scripts:     {
    'install-services': 'node ./scripts/installServices.js',
    pretest:            'eslint --fix .',
    test:               'npm run run-tests',
    tdd:                'npm run run-tdd',
    coverage:           'nyc npm run run-tests',
    'run-tests':        'cross-env LOG_LEVEL=OFF mocha --require ./spec/.config/bootstrap.js --colors --require babel-core/register ./spec/**/*.test.js',
    'run-tdd':          'mocha --require ./spec/.config/bootstrap.js --watch --colors --require babel-core/register ./spec/**/*.test.js',
    push_to_coveralls:  'nyc npm test && nyc report --reporter=text-lcov | coveralls',
  }
} );

/* eslint-enable max-len */

module.exports = class extends Generator{


  prompting(){

    const responses
      = this.responses
      = this.responses || {};

    const pkg
      = responses.package
      = Object.assign( {}, BasePackage );

    /* eslint-disable max-len */
    const prompts = [
      { type: 'input', required: true, validate: isValidString, name: 'name', message: 'project name:', default: path.basename( this.destinationPath( '.' ) ) },
      { type: 'input', name: 'version', validate: isValidString, message: 'version:', default: '0.0.1' },
      { type: 'input', name: 'description', validate: isValidString, message: 'description:', default: BasePackage.description },
      { type: 'input', name: 'repo', message: 'git repository:' },
      { type: 'input', name: 'keywords', message: 'keywords (space-delimited):' },
      { type: 'confirm', name: 'private', message: 'Is this a private repository?:', default: true },
      { type: 'input', name: 'license', validate: isValidString, when: res=>!res.private, message: 'license:', default: 'MIT' }
    ];
    /* eslint-enable max-len */

    return this
      .prompt( prompts )
      .then( res=>{

        if( res.name )    pkg.name = res.name.trim();
        if( res.version ) pkg.version = res.version.trim();

        if( res.description ) pkg.description = res.description.trim();
        if( res.keywords && !res.keywords.match( /^\w?$/ ) ) pkg.keywords = res.keywords.split( ' ' );

        if( res.repo )    pkg.repository = { type: 'git', url: res.repo.trim() };
        if( res.private ) pkg.private = res.private;
        if( res.license ) pkg.license = res.license.trim();

      } );

  }

  writing(){

    this.fs.writeJSON( this.destinationPath( 'package.json' ), this.responses.package );

  }

  install(){

    const dependencies
      = this.fs.readJSON( this.templatePath( '..', 'resource', 'dependencies.json' ) );

    dependencies.forEach( ( { packages, action } )=>this.npmInstall( packages, action ) );

  }

};


function isValidString( val ){

  return val != null && val.trim().length > 0;

}
