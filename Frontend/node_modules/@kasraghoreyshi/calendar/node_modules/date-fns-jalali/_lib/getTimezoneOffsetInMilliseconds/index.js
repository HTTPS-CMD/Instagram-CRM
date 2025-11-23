"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getTimezoneOffsetInMilliseconds;

var _index = _interopRequireDefault(require("../../_core/getMonth/index.js"));

var _index2 = _interopRequireDefault(require("../../_core/getDate/index.js"));

var _index3 = _interopRequireDefault(require("../../_core/getFullYear/index.js"));

var _index4 = _interopRequireDefault(require("../../_core/setUTCFullYear/index.js"));

var _index5 = _interopRequireDefault(require("../../_core/newDate/index.js"));

var _index6 = _interopRequireDefault(require("../../_core/dateUTC/index.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Google Chrome as of 67.0.3396.87 introduced timezones with offset that includes seconds.
 * They usually appear for dates that denote time before the timezones were introduced
 * (e.g. for 'Europe/Prague' timezone the offset is GMT+00:57:44 before 1 October 1891
 * and GMT+01:00:00 after that date)
 *
 * Date#getTimezoneOffset returns the offset in minutes and would return 57 for the example above,
 * which would lead to incorrect calculations.
 *
 * This function returns the timezone offset in milliseconds that takes seconds in account.
 */
function getTimezoneOffsetInMilliseconds(date) {
  var utcDate = (0, _index5.default)((0, _index6.default)((0, _index3.default)(date), (0, _index.default)(date), (0, _index2.default)(date), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()));
  (0, _index4.default)(utcDate, (0, _index3.default)(date));
  return date.getTime() - utcDate.getTime();
}

module.exports = exports.default;