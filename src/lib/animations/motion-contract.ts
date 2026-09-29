export type ClipDirection = "bottom" | "left" | "right";

export const LOGIN_ENTRANCE_MOTION = Object.freeze({
  visualDuration: 1.25,
  imageDuration: 1.6,
  lineDuration: 0.9,
  lineStagger: 0.09,
  revealDuration: 0.72,
  revealStagger: 0.075,
});

export function clipInset(direction: ClipDirection): string {
  if (direction === "left") return "inset(0 100% 0 0)";
  if (direction === "right") return "inset(0 0 0 100%)";
  return "inset(100% 0 0 0)";
}
