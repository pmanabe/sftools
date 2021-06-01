### sftools [Work in Progress...]

=======

## Prerequisite 
* Git
* SFDX

## Steps to use Plugin

### Step 1 
Open Console / Terminal and Clone this repository at appropriate location by runing command 
`https://github.com/pmanabe/sftools.git`

### Step 2
Navigate to folder `sftools` and run command `sfdx plugins:link`

### Step 3
Assume you have org alias authenticated in sfdx with name `sandbox`
Run below sample command against sfdx org `sandbox`

` sfdx sftools:dependency:object -u sandbox -o "Account"`

-u : (Required) Authenticated user
-o : (Required) Target standard object. Only 1 Standard Object for now...
-p : Path where csv file needs to be generated

### Commands
<!-- commands -->

-   [sfdx sftools:dependency:object -o <string> [-p <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]](#sfdx-sftoolsdependencyobject--o---p---v---u----apiversion----json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

-   [sfdx sftools:application:tab [-p <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]](#)

### Uninstalling Plugin
Rune below Command

`sfdx plugins:uninstall "<Path of Plugin Located>"`

### [Debugging your plugin](#debugging-your-plugin)
<!-- tocstop -->
<!-- install -->
<!-- usage -->
```sh-session
$ npm install -g sftools
$ sfdx COMMAND
running command...
$ sfdx (-v|--version|version)
sftools/0.0.0 darwin-x64 node-v16.0.0
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->
<!-- commands -->

<!-- commandsstop -->
<!-- debugging-your-plugin -->
# Debugging your plugin
We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of this plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands.

To debug the `hello:org` command: 
1. Start the inspector
  
If you linked your plugin to the sfdx cli, call your command with the `dev-suspend` switch: 
```sh-session
$ sfdx hello:org -u myOrg@example.com --dev-suspend
```
  
Alternatively, to call your command using the `bin/run` script, set the `NODE_OPTIONS` environment variable to `--inspect-brk` when starting the debugger:
```sh-session
$ NODE_OPTIONS=--inspect-brk bin/run hello:org -u myOrg@example.com
```

2. Set some breakpoints in your command code
3. Click on the Debug icon in the Activity Bar on the side of VS Code to open up the Debug view.
4. In the upper left hand corner of VS Code, verify that the "Attach to Remote" launch configuration has been chosen.
5. Hit the green play button to the left of the "Attach to Remote" launch configuration window. The debugger should now be suspended on the first line of the program. 
6. Hit the green play button at the top middle of VS Code (this play button will be to the right of the play button that you clicked in step #5).
<br><img src=".images/vscodeScreenshot.png" width="480" height="278"><br>
Congrats, you are debugging!

### Commands 
#### sfdx sftools:dependency:object -o <string> [-p <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

Given a list of standard objects, return a csv with a list of all related dependencies.

```
USAGE
  $ sfdx sftools:dependency:object -o <string> [-p <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -o, --objects=objects                                                             (required) Comma Seperated API name of objects to get field metadata Info
  -p, --path=path                                                                   File Name with full Path to create the excel file
  -u, --targetusername=targetusername                                               username or alias for the target org; overrides default target org
  -v, --targetdevhubusername=targetdevhubusername                                   username or alias for the dev hub org; overrides default dev hub org
  --apiversion=apiversion                                                           override the api version used for api requests made by this command
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for this command invocation

EXAMPLE
  Example : sfdx sftools:dependency:object -u sandboxorg -o "Account" -p /Users/pmanabe/Downloads/ObjectInfo.csv
```

#### sfdx sftools:application:tab [-p <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

Extract a map of all applications(Classic/Lightning) with their related tabs!

```
USAGE
  $ sfdx sftools:application:tab [-p <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -p, --path=path                                                                   File Name with full Path to create the excel file
  -u, --targetusername=targetusername                                               username or alias for the target org; overrides default target org
  --apiversion=apiversion                                                           override the api version used for api requests made by this command
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for this command invocation

EXAMPLE
  $ sfdx sftools:application:tab -u sandboxalias -p /Users/pmanabe/Downloads/Tabs.xlsx
```
