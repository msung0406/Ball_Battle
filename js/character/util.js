export function angleTo(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}
