# About Unit Tests

Add Unit Tests (__not integration or system tests__) for your lib code here.

## Writing Tests

### Ensure that your test file's path mirrors its Unit-in-Test's file path

By convention, you must define your unit tests for each module at a path that mirrors the unit-in-test's path within the `spec` folder.

For example, if your unit-in-test were located at

:point_right: _lib/services/some_service/lib/some_function/index.js_

then your unit tests for that module would be expected to be located at

:point_right: ***spec***_/lib/services/some_service/lib/some_function/index.***test***.js_.

### Test all branches, write full sentences

Make sure that you test all branches of your functions/method. We are using
[Istanbul](https://istanbul.js.org/) to analyze coverage of the tests
in the project, and while you are allowed to commit changes without
full coverage, we will not merge pull requests with less than 99% coverage.

We are using [Mocha](https://mochajs.org/)
and [Chai#expect](http://chaijs.com/guide/styles/#expect) for our tests. A
very simple test could look like this:

#### UIT Example 1

Let's assume the unit-in-test (UIT), or the function we want to test, is located
add lib/sum/index.js, looking like this:

```javascript
const isEmpty = require( 'lodash/isEmpty' );

module.exports = function sum( ...args ){

  if( isEmpty( args ) ) return 0;
  return args.reduce( (acc, x )=>acc + x );

};
```

A naive `sum` function, for sure, but let's assume we somehow knew for
sure that `args` would always all be numbers (maybe we used typescript
after all).

#### Test Example 1

Our test suite for the UIT above could look like this:

```javascript
// no '../../../' hell needed in Unit Tests;
const sum = require.main.require( 'lib/sum' );

// Start a full sentence
describe( 'The sum function', ()=>{

  // This code tests the behavior of the first branch of the UIT.
  //
  // Combined with the text in the text in the 'describe' call
  // above, this now reads:
  //
  // 'The sum function should return 0 if called with no arguments'.
  //
  // => a full, proper sentence, which will show up as such in the test
  // results.
  it( 'should return 0 if called with no arguments', ()=>{

    expect( sum() )
      .to.be( 0 );

  } );

  // Test 1 edge case (or is it a boundary case? Could be either) of the
  // 2nd branch.
  //
  // 'The sum function should return the input value if called with 1 input value'.
  it( 'should return the input value if called with 1 input value', ()=>{

    const expected = 0xDEADBEEF;
    const actual   = sum( expected );

    expect( actual  )
      .to.be( expected );

  } );

  // Test a boundary case (2 values) of the 2nd branch.
  //
  // 'The sum function should return the sum of 2 input values'
  it( 'should return the sum of 2 input values', ()=>{

    const input1   = 0;
    const input2   = 1;
    const expected = input1 + input2;
    const actual   = sum( input1, input2 );

    expect( actual  )
      .to.be( expected );

  } );

  // other test: Edge/boundary cases could involve Num.min, Num.max, etc,
  // and would involve further developing the UIT.

} );
```

### Write [Solitary Unit Tests](https://martinfowler.com/bliki/UnitTest.html#SolitaryOrSociable)

Don't test code from modules tested elsewhere, test the code you wrote in your
unit, defining positive and negative test for
[boundary](https://en.wikipedia.org/wiki/Boundary_case) and
[edge](https://en.wikipedia.org/wiki/Edge_case) cases, as well as
[corner cases](https://en.wikipedia.org/wiki/Corner_case) if possible.

#### Use [Test Doubles]( https://martinfowler.com/bliki/TestDouble.html)

Use dummies, stubs, spies, mocks, etc. to replace modules you pull in, except
standard tool libraries, like `async`, `lodash` and the like.

**Stub/mock those modules that involve major side effects, such as connecting to a
database or another remote or local service, write to a file, etc.**

The project offers you the following tools globally (i.e. you don't need 'require'
them, just use them):

##### [proxyquire](https://github.com/thlorenz/proxyquire)

Proxyquire is likely going to be the one you want to use most of the time. It
allows you to change what require will return for a certain key or path, allowing
you to mock the response and check if the behavior of the code.

###### UIT Example 2

```javascript
const aws = require( 'aws-sdk' );

module.exports = function isOnMyBucketList( lookupValue, next )=>{

  const s3 = new AWS.S3();
  s3.listBuckets( ( err, { Buckets } )=>{

    if( err ) return next( err );

    const isOnList = Buckets.some( ( { Name } )=>Name === lookupValue );
    next( null, result );

  } );


} );
```

###### Test Example 2

```javascript
describe( 'The isOnMyBucketList function', ()=>{

  // need to use 'done' here, as the UIT is async
  it( 'should return "true" if a bucket for the lookup value is found', ( done )=>{

    const lookupValue = 'goBungeeJumpingInNewZealand';

    const mockS3 = {
      constructor(){},
      listBuckets( next ){

        // UIT expect async, so be async, do not unleash Zalgo, even
        // in unit tests.
        // see http://blog.izs.me/post/59142742143/designing-apis-for-asynchrony
        setImmediate( next, null, [ lookupValue ] )

      };
    }

    const isOnMyBucketList = proxyquire(
      '../../lib/isOnMyBucketList',
      { 'aws-sdk': { S3: mockS3 } }
    );

    isOnMyBucketList( ( _, isOnList )=>{

      expect( isOnList )
        .to.be.true;

      done(); // need to tell Mocha that the async test is done

    } );

  } );

} );
```

##### [sinon](http://sinonjs.org/#get-started)

A great little library that help you creating Stubs and Spies and that
you will likely want to use in conjunction with [proxyquire](#proxyquire).

###### Test Example 3

For [UIT Example 2](#uit-example-2) you might want to test that the `listBuckets` function was called at all (you could also test for the
correct arguments, or if the arguments contained a certain value, but
the example we are using here is rather simple), like so:

```javascript

  it( 'should call the buckerListFunction', ()=>{

    const listBuckets
      = sinon.spy();

    const mockS3 = {
      constructor(){},
      listBuckets
    }

    const isOnMyBucketList = proxyquire(
      '../../lib/isOnMyBucketList',
      { 'aws-sdk': { S3: mockS3 } }
    );

    isOnMyBucketList(()=>null) );
    expect( listBuckets.called )
      .to.be.true;

  } );

```

##### [mock-fs](https://github.com/tschaub/mock-fs)

Not massively useful for lambda functions, as we should not really store data
locally when using lambda functions,ut made available nonetheless. Please refer
to mockfs documentation for more details.

## Running Tests

### Running tests once

Run `npm test`. This will also invoke `eslint --fix .`, which will auto-fix
eslint issues that can be auto-fixed and tell you what issues need to be
fixed manually to avoid breaking the build.

When the tests are run, you will gwt a report, including a list of failed
tests,should they exist and the code coverage summary report. Note that we
want to want to achieve 100% code coverage in this project and are
enforcing 99% on the build server.

### Running tests continuously (TDD-style)

Running `npm run tdd` will start to continuously run the Mocha test suite,
detecting file changes as you are working and reporting on whether the
tests succeed or not.

**Note that eslint is omitted in this case**, so if you want to avoid
nasty lint-based failure of the build of your commit, ensure to run
`eslint --fix .` or `npm test` once, addressing all linting issues before
committing.

#### Visual Studio Code

If you use Visual Studio Code, you can use the below launch configuration
to develop in TDD mode as well:

```json
    {
      "type": "node",
      "request": "launch",
      "name": "Mocha TDD",
      "program": "${workspaceFolder}/node_modules/mocha/bin/_mocha",
      "args": [
        "--timeout",
        "999999",
        "--require",
        "${workspaceFolder}/spec/.config/bootstrap.js",
        "--compilers",
        "js:babel-core/register",
        "--colors",
        "--watch",
        "${workspaceFolder}/spec/**/*.test.js"
      ],
      "env": {
        "LOG_LEVEL": "OFF"
      },
      "internalConsoleOptions": "openOnSessionStart"
    },
```
