/** 이름 뒤에 붙는 조사 "이/가"를 받침 여부에 맞춰 고릅니다. 예: "민지가", "지훈이" */
export function withSubjectParticle(name: string): string {
  const last = name.trim().at(-1);
  if (!last) return name;
  const code = last.charCodeAt(0) - 0xac00;
  // 한글 음절이 아니면(영문 등) "가"를 붙입니다.
  if (code < 0 || code > 11171) return `${name}가`;
  return code % 28 === 0 ? `${name}가` : `${name}이`;
}
