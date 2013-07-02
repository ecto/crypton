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


// XXX review: let's add some logging! we've learned over the years here at
// spideroak that logging is very helpful to have. more is better.


var app = require('../app');
var db = app.datastore;
var bcrypt = require('bcrypt');

var Account = module.exports = function Account() {};

Account.prototype.get = function (username, callback) {
  var that = this;

  db.getAccount(username, function (err, account) {
    if (err) {
      callback(err);
      return;
    }

    that.update(account);
    callback(null);
  });
};

// XXX review: this doesn't seem to have corresponding unit tests
Account.prototype.getById = function (id, callback) {
  var that = this;

  // XXX review: the part about this.id seems to indicate that we can create
  // an Account object, give it an id property, then call getById on it to
  // fill in the rest from the db. do we want to encourage that form?
  db.getAccountById(id || this.id, function (err, account) {
    if (err) {
      callback(err);
      return;
    }

    that.update(account);
    callback(null);
  });
};

Account.prototype.generateChallenge = function (callback) {
  // XXX review: we're not really generating a challenge here. we're just
  // bcrypting a challengeKey. change function name to hashChallengeKey
  if (!this.challengeKey) {
    callback('Must supply challengeKey');
    return;
  }

  var that = this;

  // XXX review: this shouldn't be named digest. digest typically refers to
  // the output of a hashing function. converting something to hex doesn't
  // make it a digest, just an alternative representation of the same thing
  var challengeKeyDigest = new Buffer(this.challengeKey).toString('hex');

  // XXX review: rather than hard-coding the work factor of 12, it would be
  // more clear to define a constant and use that. self documenting code ftw.
  bcrypt.genSalt(12, function (err, salt) {
    if (err) {
      callback(err);
      return;
    }

    bcrypt.hash(challengeKeyDigest, salt, function (err, hash) {
      if (err) {
        callback(err);
        return;
      }

      // XXX review: let's rearrange the Account object creation mechanism so
      // we don't have to create the challengeKey attribute and then delete it
      // soon after. maybe we can just pass challengeKey to some alternative
      // constructor that performs the hash and *then* creates the Account.
      that.challengeKeyHash = hash;
      // throw away the plaintext after we've bcrypted it
      delete that.challengeKey;
      callback(null);
    });
  });
};

Account.prototype.verifyChallenge = function (challengeKey, callback) {
  // XXX review: the challengeKey variable is a response from the user. let's
  // call it challengeKeyResponse to indicate that it may not be the actual
  // challengeKey
  if (typeof challengeKey != 'string') {
    challengeKey = JSON.stringify(challengeKey);
  }
  // XXX review: is challengeKey a JSON string? seems like it should just be
  // the binary output of the KDF. see the developer documentation here:
  // https://github.com/SpiderOak/crypton/blob/sjcl-docs/doc/architecture.markdown
  // as a general design recommendation, we should convert datatypes in the
  // route methods and keep internal methods using whatever datatype is
  // appropriate for the platform (ie. when the user passes us a JSON
  // representation over the wire, we convert immediately to a Buffer object
  // and pass that to verifyChallenge, etc.). model methods shouldn't be
  // concerned with datatype conversion -- that's the job of the route

  // XXX review: this isn't really a digest. see note above.
  var challengeKeyDigest = new Buffer(challengeKey).toString('hex');

  bcrypt.compare(challengeKeyDigest, this.challengeKeyHash, function (err, success) {
    if (err || !success) {
      callback('Incorrect password');
      return;
    }

    callback(null);
  });
};

// TODO add field validation and callback
// XXX review: do the TODO, for example, it really shouldn't be possible to
// create an account with invalid keys

// XXX review: the general idea seems to be to create an empty Account object
// and then immediately update it with something. we should use alternative
// constructors for this purpose, and move the validation into the
// constructors as appropriate.

// XXX review: this update function shouldn't exist -- creating the account
// object should be accomplished by constructors (see above), and changing the
// state of the account should be accomplished by methods on the Account
// object, which should validate their own input.

// for example, if you want to delete the account, we want the deletion_time
// database attribute to be updated -- we don't set this directly, we call
// account.delete() which will take care of it.

// within Account methods, we can just assign properties directly and have
// confidence that those operations are valid, because they're covered by unit
// tests
Account.prototype.update = function () {
  // update({ key: 'value' });
  if (typeof arguments[0] == 'object') {
    for (var key in arguments[0]) {
      this[key] = arguments[0][key];
    }
  }

  // update('key', 'value')
  else if (typeof arguments[0] == 'string' && typeof arguments[1] != 'undefined') {
    this[arguments[0]] = arguments[1];
  }
};

// XXX review: typically, "serializing" something means that you change it
// into a form that is transmittable over a wire, or storable on a disk -- ie.
// from a structured form to a flat, binary/text form. since this function
// doesn't do that, it needs a new name.
Account.prototype.serialize = function () {
  var fields = {};

  for (var i in this) {
    if (typeof this[i] != 'function') {
      fields[i] = this[i];
    }
  }

  return fields;
};

Account.prototype.save = function (callback) {
  db.saveAccount(this.serialize(), callback);
};

// XXX review: in the interest of having more objects that do fewer things
// (and hopefully do them better than they would otherwise), let's split
// message functionality out into a messaging module. for example, you might
// create a message object, which would have a send method that takes sender
// and recipient(s) parameters
Account.prototype.sendMessage = function (from, headers, body, callback) {
  if (!this.accountId) {
    callback('Recipient account object must have accountId');
    return;
  }

  var to = this.accountId;

  // we should be also make sure there are headers and body arguments
  // and maybe be smart about making one/both of them optional
  // but this works for now

  db.saveMessage({
    fromAccount: from,
    toAccount: to,
    headers: headers,
    body: body
  }, function (err, messageId) {
    if (err) {
      callback('Database error');
      return;
    }

    // there is definitely a better way to get the username to the receipient
    var sender = new Account();
    sender.getById(from, function (err) {
      if (app.clients[to]) {
        app.clients[to].emit('message', {
          from: {
            id: from,
            username: sender.username
          },
          headers: headers,
          body: body
        });
      }
    });

    callback(null, messageId);
  });
};

