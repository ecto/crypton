/* Crypton Server, Copyright 2013 SpiderOak, Inc.
 *
 * This file is part of Crypton Server.
 *
 * Crypton Server is free software: you can redistribute it and/or modify it
 * under the terms of the Affero GNU General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * Crypton Server is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the Affero GNU General Public
 * License for more details.
 *
 * You should have received a copy of the Affero GNU General Public License
 * along with Crypton Server.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var app = process.app;
var db = app.datastore;
var middleware = require('../lib/middleware');
var Account = require('../lib/account');

/*
 * Save account to server
 */
app.post('/account', function (req, res) {
  // XXX review: we should do validation/santitzation of input data here at
  // the entry point before we pass it down to lower levels of the system.
  // it's ok to use a helper module or something to keep this function clean,
  // of course.
  var account = new Account();
  account.update(req.body);
  // XXX review: as noted in lib/account.js, generateChallenge is not an
  // accurate name
  account.generateChallenge(function (err) {
    if (err) {
      // XXX review: in what ways could this fail? if we validate input above,
      // then under normal contitions, we should never fail to hash the key.
      // of course, if we get something like out of memory or another
      // system-level error, we shouldn't divulge that to the user - just log
      // it and return a generic error
      res.send({
        success: false,
        error: err
      });
    }

    // XXX review: we could clean up this function even more by adding a
    // helper function to account that does the hashing and saving in one step
    account.save(function (err) {
      if (err) {
        // XXX review: we probably should return a generic error message down
        // here. the only valid error message here should be username already
        // taken. we should log the real error message on the server, of
        // course
        res.send({
          success: false,
          error: err
        });

        return;
      }

      res.send({
        success: true
      });
    });
  });
});

/*
* Authorize with server
*/
app.post('/account/:username', function (req, res) {
  // XXX review: is there any restriction on the contents of :username? please
  // define a reasonable regular expression, unicode normalization/glyph
  // equivalence detection scheme and apply that here and everywhere we accept
  // username input.
  // see http://labs.spotify.com/2013/06/18/creative-usernames/
  var account = new Account();

  account.get(req.params.username, function (err) {
    if (err) {
      // XXX review: to avoid leaking information about what usernames are
      // taken, we should return a fake challengeKeySalt here so that existent
      // and non-existent usernames are indistinguishable. to make this work,
      // we have to return a stable value for a given username's fake
      // challengeKeySalt -- to produce this, we should return the hmac of the
      // provided username keyed to a special hmac key that we only use for
      // this purpose. this keeps it stateless on the server -- we don't need
      // to remember anything, etc.
      // note that theoretically, the information we're protecting against
      // leaking here (the existence of usernames) can also be obtained by
      // signing up with that username. we still want to protect this resource
      // though because an enumeration search for existing usernames (by way
      // of signup) is a very active kind of attack, likely to be noticed by
      // system operators, whereas simply trying to log in is more passive,
      // not affecting state on the server
      // XXX review: another thing to consider, is that even with the above
      // scheme in place, we can still be vulnerable to a timing attack, as
      // the timing profile of looking up a username in the database vs.
      // generating an hmac are different. to protect against this, we should
      // force the request to take some minimum amount of time to complete. so
      // define some constant minimum amount of time, then if we would
      // otherwise return before that amount of time has elapsed, wait the
      // difference before returning
      res.send({
        success: false,
        error: err
      });

      return;
    }

    res.send({
      success: true,
      challengeKeySalt: account.challengeKeySalt
    });
  });
});

/*
* Authorize with server
*/
app.post('/account/:username/answer', function (req, res) {
  // XXX review: see above note about username input validation/sanitization.
  // here we should probably also limit the length of the value for
  // challengeKey so we don't pass arbitrarily long strings down into the
  // system. use HTTP 400 bad request for this response (and this can return
  // immediately -- no risk of timing attack at this point)
  // XXX review: as above, this should handle the case of non-existent
  // usernames in an indistinguishable way from existent usernames with
  // incorrect passwords -- make sure we return the same error message, and
  // keep in mind the timing of the response as well
  var account = new Account();

  account.get(req.params.username, function (err) {
    if (err) {
      res.send({
        success: false,
        error: err
      });

      return;
    }

    account.verifyChallenge(req.body.challengeKey, function (err) {
      if (err) {
        res.send({
          success: false,
          error: err
        });

        return;
      }

      req.session.accountId = account.accountId;

      res.send({
        success: true,
        account: account.serialize(),
        sessionIdentifier: req.sessionID
      });
    });
  });
});

/*
* Change the password for account
*/
// XXX review: this appears to be unimplemented
app.post('/account/:username/keyring',
  middleware.verifySession,
  function (req, res) {
    res.send({
      success: true
    });
  }
);
