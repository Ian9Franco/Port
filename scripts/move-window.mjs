/**
 * The move has no date until Ian gives one. Spain listings store the dates
 * the posting itself states, or "unknown". Ordering waits for both sides.
 */

export function readMoveWindow(constraints) {
  const value = constraints?.relocation?.move_window;
  if (value == null || value === "" || value === "unknown") return "unknown";
  return value;
}

export function parseListingWindow(text) {
  const raw = String(text ?? "");
  const earliestMatch = raw.match(/earliest start\s+(20\d{2}-\d{2}-\d{2})/i);
  const beforeMatch = raw.match(/must start before\s+(20\d{2}-\d{2}-\d{2})/i);
  return {
    earliest_start: earliestMatch ? earliestMatch[1] : "unknown",
    must_start_before: beforeMatch ? beforeMatch[1] : "unknown"
  };
}

function rangesOverlap(moveWindow, listingWindow) {
  if (!moveWindow || typeof moveWindow !== "object" || !moveWindow.start || !moveWindow.end) return false;
  return listingWindow.earliest_start <= moveWindow.end && moveWindow.start <= listingWindow.must_start_before;
}

export function relocationValue(moveWindow, listingWindow) {
  if (moveWindow == null || moveWindow === "unknown") return "not_yet_ordered";
  if (!listingWindow || listingWindow.earliest_start === "unknown" || listingWindow.must_start_before === "unknown") {
    return "not_yet_ordered";
  }
  return rangesOverlap(moveWindow, listingWindow) ? "overlap" : "no_overlap";
}
