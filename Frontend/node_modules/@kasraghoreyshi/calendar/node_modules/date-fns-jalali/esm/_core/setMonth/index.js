import { toGregorian, toJalali } from "../../_jalali/index.js";
/**
 *
 * @param cleanDate {Date}
 * @param args
 * @returns {number}
 */

export default function setMonth(cleanDate) {
  var gd = cleanDate.getDate();
  var gm = cleanDate.getMonth() + 1;
  var gy = cleanDate.getFullYear();
  var j = toJalali(gy, gm, gd);

  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  var month = args[0],
      _args$ = args[1],
      date = _args$ === void 0 ? j.jd : _args$;
  var g = toGregorian(j.jy, month + 1, date);
  return cleanDate.setFullYear(g.gy, g.gm - 1, g.gd);
}