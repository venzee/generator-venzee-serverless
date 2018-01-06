# About Deployments

We use CodeShip to deploy to AWS. Before you can build,
you will need to have to created a new CodeShip Pro (not CodeShip Basic )
project and connect it to the git repository for this project.

## Preconditions

1. Install CodeShip's CLI [Jet](https://documentation.codeship.com/pro/builds-and-configuration/cli/)
1. Download you project's [AES Key](https://documentation.codeship.com/pro/builds-and-configuration/environment-variables/#downloading-your-aes-key)
1. Store the AES Key in the root of the project
1. Rename the AES key to `codeship.aes`. This last step is not strictly need, but it makes things easier, and the rest of this documentation assumes that you've done it.

- :exclamation: **AES files must never be checked in!**
- :information_source: AES keys are ignored by git by default.

Optionally, if you want to [run local builds](#building-locally), you must install [Docker](https://docs.docker.com/engine/installation/).

## AWS Credentials

When you [install](../lib/README.md#6-install-your-service) your services, the
framework modifies your `package.json` files, adding multiple entries for each new
service it detects.

For example, if your service were called `venzee`, calling `npm run install-services` would generate
something like the below.

```javascript
"scripts": {
  /* other entries */
  "venzee_generate_service_yml": "node scripts/build.js ./lib/services/venzee",
  "venzee_generate_package": "cd lib/services/venzee && serverless package --package /deploy/venzee",
  "venzee_dev_build": "cross-env-shell AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID_DEV AWS_REGION=$AWS_REGION_DEV \"npm run devops_tools_generate_service_yml && npm run devops_tools_generate_package\"",
  "venzee_dev_deploy": "cross-env-shell AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID_DEV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY_DEV AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID_DEV AWS_REGION=$AWS_REGION_DEV \"npm run venzee_generate_service_yml && npm run venzee_generate_package && cd lib/services/venzee && serverless deploy --verbose --package /deploy/venzee\"",
  "venzee_production_build": /* ENV variables of form AWS_*AWS_*_PRODUCTION */,
  "venzee_production_deploy": /* ENV variables of form AWS_*AWS_*_PRODUCTION */,
  "venzee_qa_build": /* ENV variables of form AWS_*AWS_*_QA */,
  "venzee_qa_deploy": /* ENV variables of form AWS_*AWS_*_QA */,
  "venzee_sandbox_build": /* ENV variables of form AWS_*AWS_*_SANDBOX */,
  "venzee_sandbox_deploy": /* ENV variables of form AWS_*AWS_*_SANDBOX */
}
```

- For each of _dev_, _production_, _qa_ and _sandbox_ 2 scripts are created
  1. a `build` script.
  1. a `deploy` script.
- The entries have the name of the form
  `{SERVICE_NAME}_{ENV_NAME}_build` and
  `{SERVICE_NAME}_{ENV_NAME}_deploy`.
- Each script depends on a set of environmental variables:
  - `AWS_ACCESS_KEY_ID_{ENV_NAME}`
  - `AWS_SECRET_ACCESS_KEY_{ENV_NAME}`
  - `AWS_ACCOUNT_ID_{ENV_NAME}`
  - `AWS_REGION_{ENV_NAME}`

The build script needs these variables defined in an encrypted file within the
[.deploy]('.') folder.

:information_source: You only need to define variables for those environments
you intend to deploy to via CodeShip

:warning *These environmental variables are used by the build service. They have nothing
to do with your application's environment at runtime.* See CodeShip's
[documentation](https://documentation.codeship.com/pro/builds-and-configuration/environment-variables/)
for more information.

### Creating the variables definition file

1. Create a new file in the [.deploy]('.') folder
1. Name the new file `.env`

   - :exclamation: **`*.env` files must never be checked in!**
   - :information_source: The project is by default configured to ignore `*.env` files
     when committing and pushing to git.

1. Set the 4 environment variables definitions for each environment you want to
   build and deploy on CodeShip.

   For example, if we wanted to build only _dev_, _qa_ and _sandbox_ and not
   _production_ on CodeShip, we could define the below env file.

   ```bash
   AWS_ACCESS_KEY_ID_DEV=********************
   AWS_SECRET_ACCESS_KEY_DEV=****************************************
   AWS_ACCOUNT_ID_DEV=************
   AWS_REGION_DEV=us-west-2

   AWS_ACCESS_KEY_ID_QA==********************
   AWS_SECRET_ACCESS_KEY_QA=****************************************
   AWS_ACCOUNT_ID_QA=************
   AWS_REGION_QA=us-west-2

   AWS_ACCESS_KEY_ID_SANDBOX=********************
   AWS_SECRET_ACCESS_KEY_SANDBOX=****************************************
   AWS_ACCOUNT_ID_SANDBOX=************
   AWS_REGION_SANDBOX=us-west-2
   ```
1. Safe the file and close it.

### Encrypting the variables file

You encrypt the file using [jet](#preconditions) using the following command:

```bash
jet encrypt .deploy/.env .deploy/env.encrypted
```

This creates the file `env.encrypted` in the `.deploy` folder.

:exclamation: **The `.deploy/env.encrypted` must be checked in***

If you want to dig deeper into encrypted variables on CodeShip, check out their
[documentation](https://documentation.codeship.com/pro/builds-and-configuration/environment-variables/#encrypted-environment-variables).

## Coveralls Credentials

You must provide Coveralls credentials in form of a repo token stored in a
separate credentials file.

### Creating the Coveralls credentials file

1. Create a new file in the [.deploy]('.') folder
1. Name the new file `coveralls-credentials.env`

   - :exclamation: **`*.env` files must never be checked in!**
   - :information_source: The project is by default configured to ignore `*.env` files
     when committing and pushing to git.

1. Set the `COVERALLS_REPO_TOKEN` environment variable in the file to the value of
   the token of your Coveralls repo.

   ```bash
   COVERALLS_REPO_TOKEN=*********************************
   ```

   :information_source: See the [Coveralls](https://docs.coveralls.io/api-introduction) documentation
   for details on how to find the token.

1. Safe the file and close it.

### Encrypting the Coveralls credentials file

You encrypt the file using [jet](#preconditions) using the following command:

```bash
jet encrypt .deploy/coveralls-credentials.env .deploy/coveralls-credentials.encrypted
```

This creates the file `coveralls-credentials.encrypted` in the `.deploy` folder.

:exclamation: **The `.deploy/coveralls-credentials.encrypted` must be checked in***

## Changing credentials

If you have access to the original or decrypted file containing the credentials you
want to change, or the credentials you want to add to, you simply make your changes
and re-encrypt the file.

If you don't have access to the original, you need to first decrypt the encrypted
version of the file you want to change.

Your general workflow would be this:

- run the jet [decrypt](https://documentation.codeship.com/pro/builds-and-configuration/environment-variables/#decrypting)
  command.
- Make your changes in the file and save it.
- Re-[encrypt](#encrypting-the-variables-file) the file
- :exclamation: *Add, commit and push the encrypted file*

For example, **with the `codeship.aes` file present in your root folder**, if you wanted
to change values in the `env.encrypted` file, you might do the following:

```bash
# decrypt the .deploy/env.encrypted file
jet decrypt .deploy/env.encrypted .deploy/.env
# change value of AWS_ZONE_DEV to us-east-1
# => this is the OSX syntax, on Linux, omit the " ''" after -i
sed -i '' -E 's/AWS_ZONE_DEV=.+/TEST=BCD/' .deploy/.env
# encrypt the .deploy/.env file
jet encrypt .deploy/.env .deploy/env.encrypted
# commit and push your changes
git commit .deploy/env.encrypted -m"Changed AWS_ZONE_DEV to us-east-1"
git push
```

## Building and Deploying on CodeShip

Every commit made to the main repository triggers a basic build. CodeShip
will run `eslint .` and the `push_to_coveralls` npm script on the branch.

If either command fails, the build will fail. The build status will be [pushed](https://documentation.codeship.com/general/account/notifications/#github-bitbucket-and-gitlab-status-api)
to [github](https://help.github.com/articles/enabling-required-status-checks/).

## CodeShip Builds

You trigger a build on CodeShip by tagging a commit on git, using a specific format.

There are 2 types of CodeShip builds you can trigger.

### 1. Build only

You can trigger a full build on CodeShip without deploying to an environment. This can
be useful when debugging builds on CodeShip.

To kick off this kind of build:

- tag the commit you want to build with a git tag of the form
  `{SERVICE_NAME}({ENV_NAME}-build-v#.#.#)`
- push the tag to your repo

For example, to build a service called _venzee_ at version `v0.0.1`
for the `sandbox` environment.

```bash
git tag -a "venzee(sandbox-build-v0.0.1)" -m "Initial Test build"
git push upstream "venzee(sandbox-build-v0.0.1)"
```

Once the tag is pushed, CodeShip will kick off a build without deploying.

:information_source: Even though the AWS environment is not accessed, the
build will still need to have access to the env.encrypted. If the file is
missing, the build will fail.

### 2. Build and Deploy

To trigger a build and deploy to an environment, you follow the same steps you'd follow
to trigger build without deploying, except the **tag has the form of**
`{SERVICE_NAME}({ENV_NAME}-v#.#.#)`, i.e. the `-build` part is dropped.

For example, to build a service called _venzee_ at version `v0.0.1` and **deploy**
it to the `dev` environment:

```bash
git tag -a "venzee(dev-v0.0.1)" -m "Initial Test build"
git push upstream "venzee(dev-v0.0.1)"
```

Once the tag is pushed, CodeShip will kick off a build and deploy to the `dev`
environment.

:warning: At time of writing, there is no version checking implemented.
It's up to the committer to ensure consistent versioning.

## Building locally

You can test building on your local machine with the below command:

```bash
jet steps --tag '{SERVICE_NAME}({ENV_NAME}[-build]-v#.#.#)
```

For example, to run a local test build of the _venzee_ service for the _dev_
environment, we could call

```bash
jet steps --tag 'venzee(dev-build-v0.0.1)'
```

:information_source: For this to work you must:

- have [Docker](https://docs.docker.com/engine/installation/) installed - see [preconditions](#preconditions).
- have the `codeship.aes` file in your project's root folder - see [preconditions](#preconditions).
- have [env.encrypted](#aws-credentials) and [coveralls-credentials.env](#coveralls-credentials) files present in the `.deploy` folder.

:warning: **CAUTION**: While we can deploy this way, the preferred method is to use CodeShip for building
and deploying. Unless you are debugging CodeShip deployments or want to prevent automatic deployment to
an environment (e.g. to production), you should not use this method to deploy, but only to test.
