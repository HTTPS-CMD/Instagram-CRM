import { toJalali } from "../../_jalali/index.js";
/**
 *
 * @param cleanDate {Date}
 * @returns {number}
 */

export default function getFullYear(cleanDate) {
  var gd = cleanDate.getDate();
  var gm = cleanDate.getMonth() + 1;
  var gy = cleanDate.getFullYear();
  return toJalali(gy, gm, gd).jy;
}