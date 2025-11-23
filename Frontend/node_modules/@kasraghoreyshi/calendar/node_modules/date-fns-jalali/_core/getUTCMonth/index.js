"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getUTCMonth;

var _index = require("../../_jalali/index.js");

/**
 *
 * @param cleanDate {Date}
 * @returns {number}
 */
function getUTCMonth(cleanDate) {
  var gd = cleanDate.getUTCDate();
  var gm = cleanDate.getUTCMonth() + 1;
  var gy = cleanDate.getUTCFullYear();
  return (0, _index.toJalali)(gy, gm, gd).jm - 1;
}

module.exports = exports.default;