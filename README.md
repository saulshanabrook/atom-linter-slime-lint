# Atom SLIME Linter

Lints your Common Lisp (`source.lisp` or `source.common-lisp`) files by attempting to compile them in Slime.

![screenshot](https://raw.githubusercontent.com/saulshanabrook/atom-linter-slime-lint/master/screenshot.png)

```bash
apm install linter-slime-lint
```

## Dependencies
* Emacs
* [SLIME](https://github.com/slime/slime). If you don't have it installed, you can just `git clone https://github.com/slime/slime.git`
  somewhere
* Common Lisp compiler. I use SBCL (`brew install sbcl`)
* [Atom Linter](https://atom.io/packages/linter). `apm install linter`

## Setup
Set the paths for the relevent executables and libraries in the settings.

## Cavaets
Since this builds the files, it will create the `.fasl` compiled versions if it
is successful.


## Background

This starts up a headless Emacs session and tries to compile the current
file, whenever you save it, using SLIME. While it would be much simpler
to just run, say `sbcl`, on your file and parse the output for errors,
`sbcl` doesn't return line numbers for the errors it encounters.
