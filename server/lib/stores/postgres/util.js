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

var connect = require('./db').connect;


// turns under_scores into camelCase
function camelize(str) {
  return str.replace(/\_(.)/g, function (x, chr) {
    return chr.toUpperCase();
  });
}
exports.camelize = camelize;

exports.camelizeObject = function camelizeObject(obj) {
  var newObj = {};
  for (var i in obj) {
    newObj[camelize(i)] = obj[i];
  }
  return newObj;
};


// callback with (error, listOfTables) from database
exports.listTables = function listTables(callback) {
  connect().then(function (client) {
    client.query('select * from pg_tables', function (err, result) {
      if (err) { return callback(err); }

      var tables = [];
      var rows = result.rows.length;

      for (var i = 0; i < rows; i++) {
        tables.push(result.rows[i].tablename);
      }

      callback(null, tables);
    });
  });
};
