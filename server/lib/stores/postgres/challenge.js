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

var db = require('./db');
var connect = db.connect;


/* Save a challenge answer
 * Return the challengeId */
exports.saveChallengeAnswer = function saveChallengeAnswer(
  account, answerDigest, callback
) {
  connect().then(function (client) {
    client.queries(callback, true, function (begin) {
      return begin
      .then(function () {
        return client.query({
          text: "insert into challenge ("
              + "  account_id, base_keyring_id, expected_answer_digest"
              + ") values ($1, $2, decode($3, 'hex')) returning challenge_id",
          values: [
            account.accountId,
            account.keyringId,
            answerDigest
          ]
        });
      })
      .fail(function (err) {
        if (err.code === '23514') {
          throw new db.HandledDatabaseError(err, 'Invalid challenge data.');
        }
        throw err;
      })
      .then(function (result) { return result.rows[0].challenge_id; });
    });

    client.done();
  });
};

exports.getChallengeAnswer = function (challengeId, callback) {
  connect().then(function (client) {
    client.queries(callback, false, function (begin) {
      return begin
      .then(function () {
        return client.query({
          text: "select * "
              + "from challenge where challenge_id=$1",
          values: [ challengeId ]
        });
      })
      .then(function (result) {
        if (!result.rows.length) {
          throw new db.HandledDatabaseError(null, 'Challenge not found.');
        }
        var row = result.rows[0];
        return row.challenge_id;
      });
    });

    client.done();
  });
};
