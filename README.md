# Atom SLIME Linter

Lints your Common Lisp (`source.lisp` or `source.common-lisp`) files by trying compiling them in Slime.

![screenshot](./screenshot.png)

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
