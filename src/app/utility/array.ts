/** Removes the specified value from the array (if found) and returns the index of its position,
 * or -1 if not found
 */
export function removeFromArray<T>(array: Array<T>, value: T): number {
  const index: number = array.indexOf(value);
  if (index >= 0) {
    array.splice(index, 1);
  }

  return index;
}
