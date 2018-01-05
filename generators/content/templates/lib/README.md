# About Serverless Services

A Serverless services is a collection of cloud-based services, which as a whole
define a single service. For example, if we defined all of Venzee's core product
in this project, we could define the API, FrontEnd, databases, queues, S3 containers,
etc as a single Serverless Service in this repository.

For more information on Serverless Services, see that framework's [services documentation](https://serverless.com/framework/docs/providers/aws/guide/services/).

## Defining a Service

We define services by generating a [serverless.yml file](https://serverless.com/framework/docs/providers/aws/guide/serverless.yml/) for it. Rather than
creating every service from scratch, we want to reuse code as much as possible, and this project
allows us to define smaller, reusable components - or rather, components that can easily be recomposed
in different service definitions.

### Creating a service

#### 1. Setup project file structure

Before we start creating lambda functions and define our StepFunctions and the like, let's setup the
basic file structure for the project:

1. Create a new folder with the name of your service inside `lib/services`.
1. Create 3 folders inside your service's folder: [functions](#SERVICE/lib), [lib](#SERVICE/lib) and [stepFunctions](#SERVICE/stepFunctions).

If your service was called `conversion_service`, your file structure would resemble the below example:

```bash
- lib
  ├── common
  ├── services
  │   └── conversion_service
  │       ├── functions
  │       ├── lib
  │       └── stepFunctions
  └── README.md
```

#### 2. Adding a lib(rary) function

Scripts stored in the lib directory are utility or similar scripts that are commonly used in the
service, but are not going to be used outside of the service (otherwise they must be moved to
the `common` folder ).

To add a library function:

1. Create a folder in the `lib` folder
1. Give the folder the name of your function, in _lowerCamelCase_, e.g. `convertTemperature`
1. Add a new file to the folder you just created
1. Name the file `index.js`
1. Define you code in `index.js`, e.g.:

   ```javascript
   const ConvertTo = Object.freeze( {
     celsius:    require( './lib/toCelsius' ),
     fahrenheit: require( './lib/toFahrenheit' )
   } );

   function convertTemperature( sourceScale, targetScale, value ){

     return ConvertTo[ targetScale.toLowerCase ]( sourceScale, value );

   }

   module.exports = convertTemperature;

   ```

1. Create another folder in the folder you just created
1. Name the folder `lib`
1. Create a file in that folder, e.g. `toCelsius.js`
1. Define your code the file just created, e.g.

   ```javascript
   const convertFrom = Object.freeze( {
     'celsius':    value=>value,
     'fahrenheit': value=> Math.round( ( value - 32 ) * 5 / 9 )

   } )

   function toCelsius( sourceScale, targetScale, value ){

     const formattedSourceScale = sourceScale.toLowerCase();

     // ...validation code omitted for example
     return convertFrom[ formattedSourceScale ]( value );

   }

   module.exports = toCelsius;

   ```
1. Create other scripts/files defining other submodules needed for the lib script as needed.

   E.g. in this case, we would need to define a `toFahrenheit.js` module in `convertTemperature/lib`.

1. Don't forget to write your unit tests!

The modules you define in this folder can now be referenced using the `<${ SERVICE_NAME }_lib>`
namespace. In this example we could import the `convertTemperature` module by calling:

```javascript
const convertTemperature = require( `<conversion_service_lib>/convertTemperature` );
```

This works anywhere in the project, including unit tests. However,
**you must refer only to [namespaces](#namespaces) of your own service or the `<common>` namespace** -
referencing modules outside of those namespaces will result in build failures on the build server or in local test builds.

Here is what file structure would now look like after adding the lib function:

```bash
- lib
  ├── common
  ├── services
  │   └── conversion_service
  │       ├── functions
  │       ├── lib
  │       │   └── convertTemperature
  │       │       ├── lib
  │       │       │   ├── toCelsius.js
  │       │       │   └── toFahrenheit.js
  │       │       └── index.js
  │       └── stepFunctions
  └── README.md
```

#### 3. Define a Lambda Function

A main purpose of creating this system was to simplify deploying lambda functions. We will definitely
want to define some of those.

By convention we use the `lib/services/{SERVICE_NAME}/functions` folder to hold our Lambda Functions and their
definitions.

To add a Lambda function definition to  `conversion_service`.

1. Create a folder in the `functions` folder
1. Give the folder the name of your function, in _lowerCamelCase_, e.g. `convertTemperature`
1. Add a new file to the folder you just created
1. Name the file `index.js`
1. Define you handler code in `index.js`, e.g.:

   ```javascript
   // import the convertTemperature module from lib/myService/lib/convertTemperature
   const convertTemperature = require( '<conversion_service_lib>/convertTemperature' );

   // see http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
   module.exports.handler = ( event, context, next )=>{

     const { sourceScale, targetScale, temperature } = event;

     try{

       next( null, convertTemperature( sourceScale, targetScale, temperature ) );

     } catch( err ){

       next( err );

     }

   }
   ```

1. Add another file to the same folder
1. Name the second file `function.json`
1. Define your Serverless function properties to `function.json`, e.g.:

   ```javascript
   // If you copy this, remember that this is json and comments need
   // to be removed
   {
      // this is the key used by Serverless to refer to the function.
      // It must be unique for each function in the service
      "convertTemperature": {
        // We are telling Serverless to look for the handler function at
        // 'functions/convertTemperature/index.js' and that the handler is called
        // `handler` in the module
        "handler":      "functions/convertTemperature/index.handler",
        // This will be the name of the lambda function in AWS - it, therefore,
        // must be unique in the AWS environment we deploy to
        "name":         "${self:provider.stage}_conversion_service_convertTemperature"
        // see https://serverless.com/framework/docs/providers/aws/guide/functions/ for
        // more configuration options
     }
   }
   ```

Your file structure would now look like this:

```bash
- lib
  ├── common
  ├── services
  │   └── conversion_service
  │       ├── functions
  │       │   └── convertTemperature
  │       │       ├── function.json
  │       │       └── index.js
  │       ├── lib
  │       │   └── convertTemperature
  │       │       ├── lib
  │       │       │   ├── toCelsius.js
  │       │       │   └── toFahrenheit.js
  │       │       └── index.js
  │       └── stepFunctions
  └── README.md
```


##### {service-root}/lib vs {service-root}/functions/{STEP_FUNCTION_NAME}/lib

One decision a developer should make is weather or not a lib functions will be used
by 1 single lambda function, or if it will be used by many.

* if the answer is _more than 1_, then the lib function should be defined inside the lib folder
  at service's root folder, e.g. `lib/services/conversion_service/lib/convertTemperature`
  as in our example.
* if the answer is _only 1_, then the lib function should be defined inside the lib folder
  at Lambda Function's root folder, as no other function will need access to it.

  For our example, we would not likely need the `convertTemperature` lib function in any
  other Lambda function, so we should refactor our layout to match the below:

  ```bash
  - lib
    ├── common
    ├── services
    │   └── conversion_service
    │       ├── functions
    │       │   └── convertTemperature
    │       │       ├── lib
    │       │       │   └── convertTemperature
    │       │       │       ├── lib
    │       │       │       │   ├── toCelsius.js
    │       │       │       │   └── toFahrenheit.js
    │       │       │       └── index.js
    │       │       ├── function.json
    │       │       └── index.js
    │       └── stepFunctions
    └── README.md
  ```

  and the require in our lambda function to

   ```javascript
   const convertTemperature = require( './lib/convertTemperature' );
   ```

#### 4. Defining Step Functions

In the previous step we defined a Lambda Function, but we didn't use it anywhere. We can use
Step Functions to reference functions, which will pull in functions into our service.

To add a Step Function definition:

1. Create a new subfolder in the `stepFunctions` subfolder of your service's folder
1. Give the folder the name of your Step Function, in _lowerCamelCase_, e.g. `convertTemperature`
1. Add a new file to the folder you just created.
1. Name the file `index.json`
1. Create your Serverless function properties in `index.json`, e.g.:

   ```javascript
    // If you copy this, remember that this is json and comments need
    // to be removed
    {
      // this is the key used by Serverless to refer to the Step Function.
      // It must be unique for each Step Function in the service
      "convertTemperature": {
        // This will be the name of the Step Function in AWS - it, therefore,
        // must be unique in the AWS environment we deploy to
        "name": "${self:provider.stage}_conversion_service_convertTemperature",
        // see http://docs.aws.amazon.com/step-functions/latest/dg/concepts-amazon-states-language.html
        // for more detail on how to define services - all task types are supported,
        // including 'parallel'
        "definition": {
          "StartAt": "AuthenticateSlackApp",
          "States": {
            "MyStepFunctionState": {
              "Type": "Task",
              // This tells the build system that we want to use 'convertTemperature',
              // which we previously declared. Note that you must
              // set the "Type" to "Task" as well
              "Resource": "<conversion_service_functions>/convertTemperature",
              "End": true
            }
          }
        }
      }
    }
   ```

Here is your updated file structure:

```bash
- lib
  ├── common
  ├── services
  │   └── conversion_service
  │       ├── functions
  │       │   └── convertTemperature
  │       │       ├── lib
  │       │       │   └── convertTemperature
  │       │       │       ├── lib
  │       │       │       │   ├── toCelsius.js
  │       │       │       │   └── toFahrenheit.js
  │       │       │       └── index.js
  │       │       ├── function.json
  │       │       └── index.js
  │       └── stepFunctions
  │           └── convertTemperature
  │               └── index.json
  └── README.md
```

#### 5. Define your service

Now you've referenced the function you defined in Step 3 in the Step Function you defined in
step 4. You now need to create a service definition file to tie it all together.

To create the service's definition file:

1. Create a new file in the root folder of your service
1. Name the file index.json
1. Define your properties in `index.json`, and list the Step Functions you want to use e.g.:

   ```javascript
   {
     "service": {
       // note that service names must contain only alpha numeric characters
       // or '-', '_' is not valid
       "name": "conversion-service",
       // see https://serverless.com/framework/docs/providers/aws/guide/variables/
       "awsKmsKeyArn": "arn:aws:kms:${self:provider.region}:${self:custom.accountId}:key/${env:AWS_KMS_KEY_ID}"
       // see https://serverless.com/framework/docs/providers/aws/guide/services/
       // to learn more about the server section of the serverless.yml file
     }
     "stepFunctions": [
       // here we reference our StepFunctions - we don't need to also reference
       // the functions themselves, as the build system will pull them in
       "<conversion_service_stepFunctions>/convertTemperature"
     ]
   }
   ```

Your final service layout:

```bash
- lib
  ├── common
  ├── services
  │   └── conversion_service
  │       ├── functions
  │       │   └── convertTemperature
  │       │       ├── lib
  │       │       │   └── convertTemperature
  │       │       │       ├── lib
  │       │       │       │   ├── toCelsius.js
  │       │       │       │   └── toFahrenheit.js
  │       │       │       └── index.js
  │       │       ├── function.json
  │       │       └── index.js
  │       ├── stepFunctions
  │       │   └── convertTemperature
  │       │       └── index.json
  │       └── index.json
  └── README.md
```

#### 6. Install your service

In order for CodeShip to detect your new service, you need to install it into the build configuration.

The below command does the trick:

```bash
npm run install-services
```

This adds entries for all services to

* [codeship-services.yml](../codeship-services.yml) - defines CodeShip build services for your service
* [codeship-steps.yml](../codeship-steps.yml) - adds build steps for the service
* [package.json](../package.json) - adds npm scripts for the service

You can further modify these entries. **Calling npm run install-services again will not modify existing
entries as long as `codeship-steps.yml` steps are defined**. If you want to reinstall a service, you
will first have to remove all entries in `codeship-steps.yml`.

## Namespaces

The build uses [Babel](http://babeljs.io/) to pre-parse our code before executing it, e.g. when we run
unit tests. Babel does more than just enable support for ES6+, but also enables us to use plugins to make
development easier. One of the plugins we are using is the
[namespaces](https://www.npmjs.com/package/babel-plugin-namespaces) plugin.

### Namespaces and Services

We actually **must not define our own namespaces for services in any config file**.

Whenever you create a new service in `lib`, the build system will recognize sub folders of that
service as a namespace. The service **MUST DEFINE the service's definition file and subfolders for namespaces to be picked up**.

Examples:

* :white_check_mark: Configured correctly:
  ```bash
  - lib
    ├── common
    ├── services
    │   └── my_service
    │       ├── functions
    │       ├── lib
    │       ├── stepFunctions
    │       └── index.json
    └── README.md
  ```

  Because `lib/services/my_service/index.json` is defined, the system will be able to interpret
  names `<my_service_functions>`, `<my_service_lib>` and `<my_service_stepFunctions>`

* :no_entry_sign: No subfolders:

  ```bash
  - lib
    ├── common
    ├── services
    │   └── my_service
    │       └── index.json
    └── README.md
  ```

  `lib/services/my_service/index.json` is defined, but no subfolders exist - the system cannot find
  namespaces for this service **`<my_service>` is NOT a valid namespace**

* :no_entry_sign: No service definition file:

  ```bash
  - lib
    ├── common
    ├── services
    │   └── my_service
    │       ├── functions
    │       ├── lib
    │       └── stepFunctions
    └── README.md
  ```

  `lib/services/my_service/index.json` is not defined - the system cannot find
  namespaces for this service **`<my_service>` is NOT a valid namespace**

### Other namespaces

### common

The purpose of the `common` namespace is to hold components intended to
be used by more than 1 service.

Import modules from the `common` namespace using the `<common>` prefix, e.g.

```javascript
const env = require( '<common>/env' );
```

Components include

* [env](common/env/README.md) is a wrapper around `process.env`.
* [logger](common/logger/README.md) is a wrapper around the logger we use for all services.
