import { toGregorian, toJalali } from "../../_jalali/index.js";
/**
 *
 * @param cleanDate {Date}
 * @param args
 * @returns {number}
 */

export default function setFullYear(cleanDate) {
  var gd = cleanDate.getDate();
  var gm = cleanDate.getMonth() + 1;
  var gy = cleanDate.getFullYear();
  var j = toJalali(gy, gm, gd);

  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  var year = args[0],
      _args$ = args[1],
      month = _args$ === void 0 ? j.jm - 1 : _args$,
      _args$2 = args[2],
      date = _args$2 === void 0 ? j.jd : _args$2;
  var g = toGregorian(year, month + 1, date);
  return cleanDate.setFullYear(g.gy, g.gm - 1, g.gd);
}