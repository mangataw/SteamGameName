// CJK Unified Ideographs, Extension A and the supplementary extensions B-I.
const HAN_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]|[\u{20000}-\u{2ee5f}\u{30000}-\u{323af}]/u;

export function containsHan(value: string): boolean {
  return HAN_PATTERN.test(value);
}

