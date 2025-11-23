"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = setDate;

var _index = require("../../_jalali/index.js");

/**
 *
 * @param cleanDate {Date}
 * @param args
 * @returns {number}
 */
function setDate(cleanDate) {
  var gd = cleanDate.getDate();
  var gm = cleanDate.getMonth() + 1;
  var gy = cleanDate.getFullYear();
  var j = (0, _index.toJalali)(gy, gm, gd);

  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  var date = args[0];
  var g = (0, _index.toGregorian)(j.jy, j.jm, date);
  return cleanDate.setFullYear(g.gy, g.gm - 1, g.gd);
}

module.exports = exports.default;