export const SWIPE_THRESHOLD_PX = 42;

export function getSwipeDirection(start, end) {
  const horizontalDistance = end.x - start.x;
  const verticalDistance = end.y - start.y;
  const absoluteHorizontal = Math.abs(horizontalDistance);
  const absoluteVertical = Math.abs(verticalDistance);

  if (
    absoluteHorizontal < SWIPE_THRESHOLD_PX ||
    absoluteHorizontal <= absoluteVertical * 1.15
  ) {
    return null;
  }

  return horizontalDistance < 0 ? "next" : "previous";
}
