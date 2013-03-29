# Crypton Developer Documentation

This is the developer documentation for the Crypton Zero-Knowledge Application
Framework.  It is intended for developers working on the Crypton framework
itself, not users of the framework.  If you are interested in developing an
application using Crypton, see [the client documentation][1].

## Getting Started

If you are reading this, you probably already have a checkout of the code, but
if not, you can clone the [repository from GitHub][2].  See the `README.md`
file in the top-level directory of the repository, or the [Getting Started][3]
section of [crypton.io][] for more details.

## Source Code Organization

Crypton consists of client API and server components.  The source code for
these components are contained in the `client/` and `server/` directories,
respectively.  There is also a set of integration tests, which utilize both
client and server components to test the interaction of the two.  The
integration tests are contained in the `integration_tests/` directory.

Each component has a `Makefile` which can be used to install dependencies,
setup test environments, compile code, and run tests.  There is also a
top-level `Makefile` which can be used to run *all* tests, by recursively
invoking `make` in the individual component directories.

## Contents

* [Architecture Overview][]
* [Coding Style][]
* [Testing][]


[1]: ../client/doc/api.md
[2]: https://github.com/SpiderOak/crypton
[3]: https://crypton.io/getting-started

[crypton.io]: https://crypton.io/
[architecture overview]: architecture.markdown
[coding style]: style.markdown
[testing]: testing.markdown
