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

var assert = require('assert');
var Account = require('../lib/account');

describe('Account model', function () {
  it('should create a blank account object', function () {
    var account = new Account();
    // XXX review: why are we testing that javascript object creation works?
    // this might be a little too fine-grained
    assert(account instanceof Account);
    // XXX review: is this a test of account.serialize? i guess we have a
    // seciton for that below...
    assert(JSON.stringify(account.serialize()) == JSON.stringify({}));
  });

  describe('update()', function () {
    it('should update the account by key/value', function () {
      // XXX review: what is the purpose of account.update? is it just to
      // control attribute assigment? validation? be sure to actually test
      // these features
      var account = new Account();
      account.update('foo', 'bar'); // XXX review: should this fail since foo
                                    // is not an expected attribute?
      assert.equal(account.foo, 'bar');
    });

    it('should update the account with an object of key/value pairs', function () {
      var account = new Account();
      account.update({
        foo: 'bar',
        bar: 'baz'
      });
      assert.equal(account.foo, 'bar');
      assert.equal(account.bar, 'baz');
    });
  });

  describe('generateChallenge()', function () {
    // XXX review: what does generateChallenge do? is it for logging in? is it
    // part of initial account creation? should add docstrings to the code to
    // clarify.
    it('should generate a challengeKeyHash', function (done) {
      var account = new Account();
      account.challengeKey = []; // XXX review: should fail validation --
                                 // challengeKey should be a string, right?
                                 // certainly not empty.
      account.generateChallenge(function (err) {
        if (err) throw err;
        // XXX review: can we assert something stronger here? maybe mock out
        // genSalt and hard code an actual bcrypt hash?
        assert.equal(typeof account.challengeKeyHash, 'string');
        done();
      });
    });

    it('should delete the challengeKey', function (done) {
      // XXX review: why are we deleting an attribute? if all we need
      // challengeKey for is to run this hash, shouldn't it be a function
      // parameter?
      var account = new Account();
      account.challengeKey = [];
      account.generateChallenge(function (err) {
        assert.equal(typeof account.challengeKey, 'undefined');
        done();
      });
    });

    it('should fail if there is no challengeKey', function (done) {
      // XXX review: good, we should fail when there's not enough information
      // to do the work :)
      var account = new Account();
      account.generateChallenge(function (err) {
        assert.equal(err, 'Must supply challengeKey');
        done();
      });
    });

    it('should return an error if genSalt fails');
    it('should return an error if hash fails');
    // XXX review: it's not clear how genSalt or hash would actually fail, but
    // we wrote error handlers, so we should test them. it will at least be a
    // good exercise in enumerating the possible failure scenarios
  });

  describe('verifyChallenge()', function () {
    // XXX review: i usually test the success case first -- when practicing
    // TDD, that is what you would naturally do. start with the simplest thing
    // and add complexity as you build up a body of tests. failure handling is
    // complexity you add later.
    it('should callback with err on wrong password', function (done) {
      var account = new Account();
      account.challengeKey = [];
      account.generateChallenge(function (err) {
        // XXX review: maybe we should call this challengeKeyResponse to be
        // consistent with the parameter to verifyChallenge
        var response = [];
        account.verifyChallenge(response, function (err) {
          assert.equal(err, 'Incorrect password');
          done();
        });
      });
    });

    it('should callback without error on correct input', function (done) {
      var account = new Account();
      // pbkdf2 of 'bananas' and random salt
      var key = '[-1284768048,-920447856,-475398093,1331192739,-1763268843,1822534881,-85602294,1946893769]';
      account.challengeKey = key;
      // XXX review: why not set challengeKeyHash directly so this only tests
      // verifyChallenge and not generateChallenge as well?
      account.generateChallenge(function (err) {
        // key would now be generated in browser with saved salt
        // XXX review: wasn't "key" called "response" earlier? let's be
        // consistent
        account.verifyChallenge(key, function (err) {
          if (err) throw err;
          done();
        });
      });
    });
  });

  describe('serialize()', function () {
    // XXX review: "should return an object"
    it('should do return an object', function () {
      // XXX review: see comment about terminology in the implementation file
      // -- output from a "serialize" function should probably be "string"
      var account = new Account();
      var ret = account.serialize();
      assert.equal(typeof ret, 'object');
    });

    it('should do return account properties', function () {
      var account = new Account();
      account.update('foo', 'bar');
      var ret = account.serialize();
      assert.equal(ret.foo, 'bar');
    });

    // XXX review: pending test: if we're doing TDD, this should have been
    // written before the "typeof != function" line in the implementation
    it('should not return properties that are functions');
  });

  describe('save()', function () {
    it('should save valid accounts', function (done) {
      var account = new Account();

      // XXX review: this represents the data submitted by the user, right?
      // let's call it something that indicates that like requestedAccount
      var user = {
        username: 'pizza',
        keypairSalt: '[1,2,3]',
        keypairCiphertext: { keypair: 'ciphertext' },
        pubKey: { pub: 'key' },
        challengeKeyHash: 'string',
        challengeKeySalt: '[1,2,3]',
        symKeyCiphertext: { sym: 'key' },
        containerNameHmacKeyCiphertext: '[1,2,3]',
        hmacKeyCiphertext: '[1,2,3]'
      };

      account.update(user);

      account.save(function (err) {
        if (err) throw err;
        // XXX review: so this tests that we don't get an error, but it
        // doesn't test that we've actually saved anything. either query the
        // database for a pizza account and compare to the submitted data, or
        // mock out the database and ensure that the correct calls have been
        // made. since this is a unit test and not an integration test, i
        // would probably do the latter.
        done();
      });
    });

    it('should err out for invalid accounts', function (done) {
      // XXX review: this is really testing that we err out for //empty//
      // accounts. this may be a good test, but then we should also have a
      // test that errs out for a non-empty but invalid account. this also
      // implies that we have an idea about what invalid means in this
      // context.
      var account = new Account();

      account.save(function (err) {
        assert(err !== null);
        done();
      });
    });
  });

  // XXX review: it would be nice if tests were in the same order as the
  // methods in the implementation. ie. since get() is at the top of
  // lib/account.js, it would be easier to find this test if it were also at
  // the top of this file
  describe('get()', function () {
    // XXX review: by "fill out" we mean "retrieve from the db"
    it('should fill out account object', function (done) {
      var account = new Account();
      // XXX review: so we only have a "pizza" account because the test above
      // saved it, right? tests should be isolated from one another, because
      // otherwise a whole slew of assumptions get pulled in about the state
      // of the world. a good unit test will set up the exact state needed to
      // accomplish what it sets out to test, and no more -- this lets us
      // avoid writing tests that pass accidentally
      account.get('pizza', function (err) {
        if (err) throw err;
        assert.equal(account.username, 'pizza');
        // XXX review: there should be more asserts than just the username is
        // 'pizza' because that's what we passed in to the get function. there
        // should be stronger validation that we got a real account back.
        done();
      });
    });

    it('should callback with error if given nonexistant username', function (done) {
      var account = new Account();
      account.get('pizzasaurus', function (err) {
        // XXX review: FYI: at this internal level it's ok, but in general, at
        // the view level, we should only return one error message for any
        // login-related failure: something like "invalid username/password"
        // -- to prevent information leakage
        assert.equal(err, 'Account not found.');
        done();
      });
    });
  });
});

