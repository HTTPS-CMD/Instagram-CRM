"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isLeapYear;

var _index = require("../../_jalali/index.js");

/**
 *
 * @param year {number}
 * @returns {boolean}
 */
function isLeapYear(year) {
  return (0, _index.isLeapJalaliYear)(year);
}

module.exports = exports.default;