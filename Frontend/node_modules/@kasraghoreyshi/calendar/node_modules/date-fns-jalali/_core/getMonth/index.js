"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getMonth;

var _index = require("../../_jalali/index.js");

/**
 *
 * @param cleanDate {Date}
 * @returns {number}
 */
function getMonth(cleanDate) {
  var gd = cleanDate.getDate();
  var gm = cleanDate.getMonth() + 1;
  var gy = cleanDate.getFullYear();
  return (0, _index.toJalali)(gy, gm, gd).jm - 1;
}

module.exports = exports.default;