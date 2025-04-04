export function getObjectDiff<T extends object>(
  oldObj: T,
  newObj?: Partial<T>,
) {
  const changedFields: Partial<T> = {};

  for (const key in newObj) {
    if (newObj[key] !== oldObj[key]) {
      changedFields[key] = newObj[key];
    }
  }

  return changedFields;
}
