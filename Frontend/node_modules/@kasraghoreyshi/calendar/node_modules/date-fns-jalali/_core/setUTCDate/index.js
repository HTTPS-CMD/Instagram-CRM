"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = setUTCDate;

var _index = require("../../_jalali/index.js");

/**
 *
 * @param cleanDate {Date}
 * @param args
 * @returns {number}
 */
function setUTCDate(cleanDate) {
  var gd = cleanDate.getUTCDate();
  var gm = cleanDate.getUTCMonth() + 1;
  var gy = cleanDate.getUTCFullYear();
  var j = (0, _index.toJalali)(gy, gm, gd);

  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  var date = args[0];
  var g = (0, _index.toGregorian)(j.jy, j.jm, date);
  return cleanDate.setUTCFullYear(g.gy, g.gm - 1, g.gd);
}

module.exports = exports.default;