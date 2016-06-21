'use babel'
import {execFile} from 'child_process'

function elispArgs (file) {
  const sexps = [
    `(add-to-list 'load-path "${atom.config.get('linter-slime-lint.slimePath')}")`,
    "(require 'slime)",
    "(require 'json)",
    `(setq inferior-lisp-program "${atom.config.get('linter-slime-lint.lispExecutable')}")`,
    '(slime)',

    // from https://github.com/technomancy/slime/blob/c27dd18db765c005bbdac9044b8ab513805e7e75/slime.el#L7307-L7308
    '(while (not (slime-connected-p)) (sit-for 1))',

    // if swank encoutners an error, we should just abort and not hang on it.
    "(add-hook 'sldb-hook #'sldb-abort)",
    '(setf *result* nil)',
    '(defun finished-compile (result) (setf *result* result))',

    // Can't use 'slime-eval-lisp' (which is synchronous) because it fails to exit out of error conditions properly
    `(slime-eval-async
      \`(swank:compile-file-for-emacs
         "${file}"
         t
         ':policy '((cl:debug . 3)))
      #'finished-compile)`,

    '(while (not *result*) (sit-for 1))',
    '(princ (json-encode (vconcat (second *result*))))'
  ]
  return sexps.reduce((arr, sexp) => arr.concat('--eval', sexp), [])
}

function warning (message, details) {
  console.error('[Linter-SLIME]', message, details)
  atom.notifications.addWarning('[Linter-SLIME]',
    { detail: message + ', check your console for more info' }
  )
}

export default {
  config: {
    slimePath: {
      type: 'string',
      description: 'Path to your SLIME install',
      default: '~/.emacs.d/slime/'
    },
    lispExecutable: {
      type: 'string',
      default: '/usr/local/bin/sbcl',
      description: 'Path to your Common Lisp executable (i.e. `inferior-lisp-program`)'
    },
    emacsExecutable: {
      type: 'string',
      default: '/usr/local/bin/emacs',
      description: 'Path to your Emacs executable'
    }
  },
  activate (state) {
    // Activates and restores the previous session of your package.
  },
  deactivate () {
    // When the user or Atom itself kills a window, this method is called.
  },
  serialize () {
    // To save the current package's state, this method should return
    // an object containing all required data.
  },
  provideLinter () {
    const Helpers = require('atom-linter')

    return {
      name: 'SLIME',
      grammarScopes: ['source.lisp', 'source.common-lisp'],
      scope: 'file',
      lintOnFly: false,
      lint (textEditor) {
        const filePath = textEditor.getPath()
        const emacs = atom.config.get('linter-slime-lint.emacsExecutable')
        const args = ['-Q', '--batch', ...elispArgs(filePath)] // .replace(/'/g, "\\'")
        return new Promise((resolve, reject) => execFile(emacs, args, {encoding: 'utf8'}, (error, stdout, stderr) => {
          if (error) {
            warning('Emacs command failed', {error, args, stdout, stderr})
            resolve([])
            return
          }
          // if (status !== 0) {
          //   warning('Emacs command didnt exit cleanly', {args, stdout, stderr})
          //   resolve([])
          //   return
          // }
          try {
            var parsed = JSON.parse(stdout)
          } catch (error) {
            warning('Failed to parse SLIME response as JSON', {error, stdout, stderr, args})
            resolve([])
            return
          }

          /* Sample JSON of an `o`s:
            {
              "message": "undefined type: OBSTACLES",
              "severity": "style-warning",
              "location": [
                "location",
                {
                  "file": "/Users/saul/projects/rspace/src/visibility-graph.lisp"
                },
                {
                  "position": 788
                },
                null
              ],
              "references": null
            },
            {
              "message": "undefined type: OBSTACLES",
              "severity": "style-warning",
              "location": [
                "location",
                {
                  "file": "/Users/saul/projects/rspace/src/visibility-graph.lisp"
                },
                {
                  "position": 512
                },
                null
              ],
              "references": null,
              "source-context": "--> PROGN SB-IMPL::%DEFUN SB-IMPL::%DEFUN SB-INT:NAMED-LAMBDA FUNCTION \n--> SB-C::%FUNCALL MULTIPLE-VALUE-BIND LET UNLESS IF \n==>\n  (TYPEP #:G12 'RSPACE.VISIBILITY-GRAPH::OBSTACLES)\n"
            },
          */
          resolve(parsed.map((o) => {
            try {
              var type = o.severity.indexOf('warning') !== -1 ? 'Warning' : 'Error'
            } catch (error) {
              warning("Couldn't determine `type` from SLIME", {error, o})
              return {}
            }

            try {
              var text = o.message
            } catch (error) {
              warning("Couldn't determine `message` from SLIME", {error, o})
              return {}
            }
            if (o.location.error === 'No error location available') {
              return {}
            }
            try {
              var errorFilePath = o.location[1].file
            } catch (error) {
              warning("Couldn't determine `filePath` from SLIME", {error, o})
              return {}
            }

            try {
              var charNumber = o.location[2].position
            } catch (error) {
              warning("Couldn't determine `lineNumber` from SLIME", {error, o})
              return {}
            }
            const buffer = textEditor.getBuffer()
            const position = buffer.positionForCharacterIndex(charNumber)
            return {
              type,
              text,
              range: Helpers.rangeFromLineNumber(textEditor, position.row, position.column),
              filePath: errorFilePath
            }
          }).filter((o) => o.type))
        }))
      }
    }
  }
}
