// Query key factory of the __module__ module: queries and invalidations always use the same keys.
export const __module__Keys = {
  all: ['__module__'] as const,
  __resources__: () => [...__module__Keys.all, '__resources__'] as const,
}
