# linter-verification

Linter package with support for the program verification tools [Dafny](https://www.microsoft.com/en-us/research/project/dafny-a-language-and-program-verifier-for-functional-correctness/), Chalice and [Boogie](https://www.microsoft.com/en-us/research/project/boogie-an-intermediate-verification-language/), provided that for each desired tool its grammar (language package) is installed (and, of course, the tool itself).

## Requirements

1. Install the [Linter](https://atom.io/packages/linter) package.
2. Install the language package for the desired verification language, for example [language-dafny](https://atom.io/packages/language-dafny).

## Installation

Atom → File → Settings → Install → `linter-verification`, or:

```sh
$ apm install linter-verification
```

## Configuration

By default, each supported verification tool is resolved against the `PATH` variable. If the location of the tool's binary is added to the path, there's no need to change its `executablePath` setting.

Additionally, one may change the `executableArguments` (options) passed to the verification tool. By default, the first line (banner) is excluded as this adds needless overhead. For Dafny, compilations are turned off for similar reasons.

It is possible to change these settings in the Settings View:

Atom → File → Settings → Packages → `linter-verification`.

Alternatively, change them via Atom's `config.json`, for example:

```coffeescript
"linter-verification":
  executableSettings:
    # By default the `dafny` binary is resolved from the path variable.
    dafnyExecutablePath: "/path/to/dafny"
    # Execute `dafny /help` for all possible options.
    dafnyExecutableArguments: [
      "/nologo"
      "/compile:0"
    ]
```
