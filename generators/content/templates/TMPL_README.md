# <%= name %>

<%= description %>

- [About Serverless Services](lib/README.md)
- [About Unit Tests and Test Coverage](spec/lib/README.md)
- [About Deployments](.deploy/README.md)

## Branching

For this repository, we are implementing [Atomic Change Flow](https://www.feval.ca/posts/Atomic-Change-Flow-A-simple-yet-very-effective-source-control-workflow/).

Developers need to do the fork the repository; just like GitFlow, Atomic Change flow
requires you to work off your own fork.

When you work on a feature or bug, you do the following:

1. Create a new branch off the _master_ branch, naming it appropriately[*]
1. Change the status of the Feature or Bug to _In Progress_ in Jira
1. Write your code
1. Commit and push all you changes to the branch in your fork
1. Create a pull request against the feature branch with the same name in the main repository (i.e. venzee-lambda) - you or an admin might have to create this branch.
1. Change the status of the Jira ticket to _Ready for Review_ and assign reviewers. If no changes are required, proceed to Step 11.
1. Change the status back to _In Progress_.
1. Address all required changes.
1. Commit and push all changes made. The pull request will be updated.
1. Continue at Step 6.
1. Change the Status to _Ready to merge_.

Once the code is merged into the release branch, it will be testable. If testing
unveils problems, the ticket might be returned to you, in which case it will become
a high priority ticket by default and should be addressed asap. If no issues are
found...bliss...

[*] naming conventions are `bug/{JIRA_TICKET}`, `feature/{JIRA_TICKET}`,
`task/{JIRA_TICKET}`. For example, if we dealt with a feature with Jira ticket
`TM1-1789`, we'd create a branch called `feature/TM1-1789`.

## Writing Code

### ES6+

Because we are bound by the version of Node AWS Lambda supports, we cannot use the full feature set of NodeJs:latest. We will take
advantage of all features supported by the current LTS version of Node. We,
therefore, will use ES6.

### Style

Why have style rules? In his book [Clean Code](https://www.safaribooksonline.com/library/view/clean-code/9780136083238/chapter05.html#ch5lev1sec4)
Robert C. Martin, also know as Uncle Bob, puts it like this:

>*Team Rules*
>
>[...]Every programmer has his own favorite formatting rules, but if he works in
> a team, then the team rules.
>
> A team of developers should agree upon a single formatting style, and then
> every member of that team should use that style. We want the software to have
> a consistent style. We don’t want it to appear to have been written by a bunch
> of disagreeing individuals.
>
> [...]
>
> Remember, a good software system is composed of a set of documents that read
> nicely. They need to have a consistent and smooth style. The reader needs to
> be able to trust that the formatting gestures he or she has seen in one source
> file will mean the same thing in others. The last thing we want to do is add
> more complexity to the source code by writing it in a jumble of different
> individual styles.

We also don't want to have to learn 5, 10, 20 different styles of code to effectively
review each others code. We are using the same language in all of or projects,
we should limit context switching to understanding what code does, not how it
is formatted.

For the most part we follow the [AirBNB style guide](https://github.com/airbnb/javascript),
with the below additions and variations.

#### Keep your code concise

We want to avoid long, hard to read functions that implement a slew of things.
Applying Uncle Bob's
[Principles of OOD](http://butunclebob.com/ArticleS.UncleBob.PrinciplesOfOod) -
and they are applicable to more than just OOP, see
[Clean Architecture](https://www.safaribooksonline.com/library/view/clean-architecture-a/9780134494272/) -
we define small functions to do work, other functions to combine the worker
functions, etc. We do not want code files multiple thousands of lines long.

#### Prefer highly modular code over lengthy files

Instead of writing lengthy files containing many functions, we want for
the most part declare one module per function. Since we want to achieve
[100% code coverage](./spec/lib/README.md#Running-tests-once) and generally
want to create [solitary Unit Tests](./spec/lib/README.md#write-solitary-unit-tests),
the reason for this should be quite clear.

#### Prefer functional programming over OOP

Lambda functions are by design stateless. One main reason to use OOP is to
manage object state, which on the server we rarely need to do. We will manipulate
data structures retrieved from another server or send to us by a client - these
are text book use cases for functional programming.

Note that this rule does not pertain to **ALL** venzee projects and is not
meant as a suggestion to go this route everywhere. The OOP and Function Programming
paradigms should be seen as tools - each have their place, and often we will
find a mix in out projects.

For example, front end projects are text book examples of stateful environments,
and will likely prefer OOP over functional programming in many areas...

#### Prefer native implementations over library functions

While defacto-standards like `lodash` and the like still can be used, we prefer
to use native implementations of most functions defined in those libraries.

```javascript

// bad
const reduce  = require( 'lodash/reduce' );
const result1 = reduce( [ 'Do', 'not', 'use', 'lodash', 'reduce' ], doSomething );

// good
const result2 = [ 'Use', 'array', 'reduce' ].reduce( doSomething );

```

#### Do not import full libraries

We don't need all of lodash or all of async in our functions, so don't pull them
all in. The build process will otherwise create unnecessary bloat.

```javascript
const something = {};

// bad
const _ = require( 'lodash' );
console.log( `Is something empty (T/F)? ${ _.isEmpty( something ) }` );

// good
const isEmpty = require( 'lodash/isEmpty');
console.log( `Is something empty (T/F)? ${ isEmpty( something ) }` );

```

#### Give your callbacks meaningful names

Names like `cb` and `callback` are already flagged as errors by eslint. In general,
prefer names that indicate the purpose of a callback function and avoid anonymous
functions.

Using a descriptive name will tell the reader of the code what the author
intentions are when results are received. Doing so will also make it
significantly easier to track down errors, especially for developers unfamiliar
with the code, and even for the author, when he or she has not worked on that
particular code for a while.

#### Misc

##### Don't check in commented out code

Commented out code unnecessarily breaks up the code, making it harder to read.
If you need to bring back previously removed code, use git - that's what Version
Control Systems are for (well, that, and to do a bunch of other things).
