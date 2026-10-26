export function getSwiperGap(gap: number) {
  return Math.max(0, gap);
}

export function getSwiperStep(page: number, gap: number) {
  return page + getSwiperGap(gap);
}

export function getSwiperSpan(page: number, count: number, gap: number) {
  if (count <= 0) {
    return 0;
  }
  return count * page + (count - 1) * getSwiperGap(gap);
}
