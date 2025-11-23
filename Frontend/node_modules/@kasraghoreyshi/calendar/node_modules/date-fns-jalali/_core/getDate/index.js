"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getDate;

var _index = require("../../_jalali/index.js");

/**
 *
 * @param cleanDate {Date}
 * @returns {number}
 */
function getDate(cleanDate) {
  var gd = cleanDate.getDate();
  var gm = cleanDate.getMonth() + 1;
  var gy = cleanDate.getFullYear();
  return (0, _index.toJalali)(gy, gm, gd).jd;
}

module.exports = exports.default;