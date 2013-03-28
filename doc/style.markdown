# Coding Style

Currently, Crypton is implemented in JavaScript.  We have adopted the following
practices to keep the code consistent, clear, and maintainable.  We favor
readability over cleverness, and recommend giving [Chris Newton's essay on
Readability][1] a read.  We also strongly recommend Douglas Crockford's
[Javascript: The Good Parts][2], especially [Appendix A, The Awful Parts][3];
and [Appendix B, The Bad Parts][4].

* Use semicolons ([semicolon insertion considered harmful!][5]).
* Restrict line length to 79 characters (except for rare unavoidable cases like
  long string literals).
  * Avoid using end-of-line backslashes to continue long lines.  You often
    don't need them, and using parentheses tends to be more clear.
* Use named functions whenever appropriate.  Anonymous functions should only be
  considered when using named functions would harm readability (ie. as
  arguments to `map()`, `each()`, etc.).
* Keep callback depth to no more than 2 levels, unless there is a good reason.
* Indent with 2 spaces.  Do not mix tabs and spaces.  For existing projects,
  match the style already established, unless someone wants to convert the
  whole file.
* Use camelCase.
* Write short, simple functions; avoid long, multi-purpose ones.

> Everyone knows that debugging is twice as hard as writing a program in the
> first place.  So if you're as clever as you can be when you write it, how
> will you ever debug it?
> -- <cite>[Brian Kernighan, The Elements of Programming Style][6]</cite>

We have attempted to capture the above guidelines in a [jshint][]
configuration:

    {
      "predef": [ "describe", "it", "before", "after", "beforeEach", "afterEach" ],
      "browser": true,
      "devel": true,
      "node": true,
      "camelcase": true,
      "curly": true,
      "eqeqeq": true,
      "immed": true,
      "indent": 2,
      "latedef": true,
      "newcap": true,
      "noarg": true,
      "plusplus": true,
      "undef": true,
      "unused": true,
      "strict": true,
      "maxparams": 8,
      "maxdepth": 8,
      "maxstatements": 100,
      "maxcomplexity": 15,
      "maxlen": 79,
      "multistr": true,
      "laxcomma": true
    }


[1]: http://clarityincode.com/readability/
[2]: http://shop.oreilly.com/product/9780596517748.do
[3]: http://oreilly.com/javascript/excerpts/javascript-good-parts/awful-parts.html
[4]: http://oreilly.com/javascript/excerpts/javascript-good-parts/bad-parts.html
[5]: http://oreilly.com/javascript/excerpts/javascript-good-parts/awful-parts.html#semicolon_insertion
[6]: http://en.wikipedia.org/wiki/The_Elements_of_Programming_Style

[jshint]: http://www.jshint.com/
