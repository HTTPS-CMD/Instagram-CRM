"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = newDate;

var _index = _interopRequireDefault(require("../_lib/requiredArgs/index.js"));

var _index2 = _interopRequireDefault(require("../_core/newDate/index.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @name newDate
 * @category Day Helpers
 * @summary Create a date object of the given params.
 *
 * @description
 * Create a date object of the given params.
 *
 * @param {Number} year - the number of years
 * @param {Number} month - the number of months 0-11
 * @param {Number} date - the number of days 1-31
 * @param {Number} [hours=0] - the number of hours 0-23
 * @param {Number} [minutes=0] - the number of minutes 0-59
 * @param {Number} [seconds=0] - the number of seconds 0-59
 * @param {Number} [ms=0] - the number of milliseconds 0-999
 * @returns {Date} the new date
 * @throws {TypeError} 3 arguments required
 *
 * @example
 * // Create the 30th September 2014:
 * var result = newDate(2014, 8, 30)
 * //=> Tue Sep 30 2014 00:00:00
 */
function newDate(year, month, date) {
  var hours = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
  var minutes = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
  var seconds = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
  var ms = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;
  (0, _index.default)(3, arguments);
  return (0, _index2.default)(year, month, date, hours, minutes, seconds, ms);
}

module.exports = exports.default;