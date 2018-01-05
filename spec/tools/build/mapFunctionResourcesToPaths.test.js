import mapFunctionResourcesToPaths from '<tools>/build/mapFunctionResourcesToPaths';

describe( 'The tools/build/getFunctionPaths function', ()=>{

  it( 'should retrieve paths from step function definitions', ()=>{

    const someState = {
      Type:     'Task',
      Resource: './someResource'
    };

    const input
      =  { definition: { States: { SomeState: someState } } };
    const expected
      = [ { paths: [ [ 'SomeState', 'Resource' ]  ], resource: './someResource' } ];
    const actual
      = mapFunctionResourcesToPaths( input );

    expect( actual ).to.deep.equal( expected );

  } );

  it( 'should include only tasks of task_type function in the result', ()=>{

    const input =  { definition: { States: {
      SomeStateUsingFunctionResource: {
        Type:     'Task',
        Resource: './someResource'
      },
      SomeStateUsingActivityResource: {
        Type:     'Task',
        Resource: 'arn:aws:lambda:${env:AWS_REGION}:${env:AWS_ACCOUNT_ID}:activity:someActivity'
      }
    } } };

    const expected
      = [ { paths: [ [ 'SomeStateUsingFunctionResource', 'Resource' ]  ], resource: './someResource' } ];

    const actual
      = mapFunctionResourcesToPaths( input );

    expect( actual ).to.deep.equal( expected );

  } );

  it( 'should ignore non-resourced-based steps', ()=>{

    const input =  { definition: { States: {
      SomePassTypeState:    { Type: 'Pass' },
      SomeChoiceTypeState:  { Type: 'Choice' },
      SomeWaitTypeState:    { Type: 'Wait' },
      SomeSucceedTypeState: { Type: 'Succeed' },
      SomeFailTypeState:    { Type: 'Fail' },
      SomeTaskTypeState:    { Type: 'Task', Resource: './someResource' }
    } } };

    const expected
      = [ { paths: [ [ 'SomeTaskTypeState', 'Resource' ]  ], resource: './someResource' } ];

    const actual
      = mapFunctionResourcesToPaths( input );

    expect( actual ).to.deep.equal( expected );

  } );

  it( 'should support parallel steps', ()=>{

    const FirstChildFunctionTaskState = {
      Type:     'Task',
      Resource: './firstChildFunctionResource'
    };

    const SecondChildFunctionTaskState = {
      Type:     'Task',
      Resource: './secondChildFunctionResource'
    };

    const input =  { definition: { States: {
      SomeParallelTypeState: {
        Type:     'Parallel',
        Branches: [
          { States: { FirstChildFunctionTaskState } },
          { States: { SecondChildFunctionTaskState } },
        ]

      }
    } } };

    const expected = [
      {
        paths:    [ [ 'SomeParallelTypeState', 'Branches', 0, 'States', 'FirstChildFunctionTaskState', 'Resource' ] ],
        resource: './firstChildFunctionResource'
      },
      {
        paths:    [ [ 'SomeParallelTypeState', 'Branches', 1, 'States', 'SecondChildFunctionTaskState', 'Resource' ] ],
        resource: './secondChildFunctionResource'
      }
    ];

    const actual
      = mapFunctionResourcesToPaths( input );

    expect( actual ).to.deep.equal( expected );

  } );

  it( 'should support multi-level parallel steps', ()=>{

    const FirstChildFunctionTaskState = {
      Type:     'Task',
      Resource: './firstChildFunctionResource'
    };

    const ThirdLevelFirstChildFunctionTaskState = {
      Type:     'Task',
      Resource: './thirdLevelFirstChildFunctionTaskState'
    };

    const ThirdLevelSecondChildFunctionTaskState = {
      Type:     'Task',
      Resource: './thirdLevelSecondChildFunctionTaskState'
    };

    const SecondLevelParallelTask = {
      Type:     'Parallel',
      Branches: [
        { States: { ThirdLevelFirstChildFunctionTaskState } },
        { States: { ThirdLevelSecondChildFunctionTaskState } },
      ]
    };

    const input =  { definition: { States: {
      TopLevelParallelTask: {
        Type:     'Parallel',
        Branches: [
          { States: { FirstChildFunctionTaskState } },
          { States: { SecondLevelParallelTask } },
        ]
      }
    } } };

    const expected = [
      {
        resource: './firstChildFunctionResource',
        paths:    [ [ 'TopLevelParallelTask', 'Branches', 0, 'States', 'FirstChildFunctionTaskState', 'Resource' ] ]
      },
      {
        resource: './thirdLevelFirstChildFunctionTaskState',
        paths:    [
          [
            'TopLevelParallelTask','Branches', 1, 'States',
            'SecondLevelParallelTask', 'Branches', 0, 'States',
            'ThirdLevelFirstChildFunctionTaskState', 'Resource'
          ]
        ],
      },
      {
        resource: './thirdLevelSecondChildFunctionTaskState',
        paths:    [
          [
            'TopLevelParallelTask','Branches', 1, 'States',
            'SecondLevelParallelTask', 'Branches', 1, 'States',
            'ThirdLevelSecondChildFunctionTaskState', 'Resource'
          ]
        ],
      }
    ];

    const actual
       = mapFunctionResourcesToPaths( input );

    expect( actual ).to.deep.equal( expected );

  } );

} );
