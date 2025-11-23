import { toJalali } from "../../_jalali/index.js";
/**
 *
 * @param cleanDate {Date}
 * @returns {number}
 */

export default function getUTCDate(cleanDate) {
  var gd = cleanDate.getUTCDate();
  var gm = cleanDate.getUTCMonth() + 1;
  var gy = cleanDate.getUTCFullYear();
  return toJalali(gy, gm, gd).jd;
}