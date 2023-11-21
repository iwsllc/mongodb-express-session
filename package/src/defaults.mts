/**
 * Shallow defaults. This basically assigns in when target is undefined.
 *
 * i.e.
 *
 * ```
 * defaults({a: 1}, {b: 2}, {b: 3, c: 4})
 * result: {a: 1, b: 2, c: 4}
 * ```
 *
 * @param dest destination object.
 * @param sources params sources applied sequentially left to right.
 * @returns
 */
export const defaults = (dest: any, ...sources: any) => {
	if (sources == null) return dest

	// for each source
	for (let ix = 0; ix < sources.length; ix++) {
		const source = sources[ix]
		const keys = Object.keys(source)
		// for each key
		for (let kx = 0; kx < keys.length; kx++) {
			const key = keys[kx]
			if (typeof dest[key] === 'undefined' && typeof source[key] !== 'undefined') { // prop doesn't exist on dest
				dest[key] = source[key]
			}
		}
	}

	return dest
}

/**
 * Deep defaults. This basically assigns in when target prop is undefined and recurses through source object props, left to right.
 *
 * i.e.
 *
 * ```
 * defaults({a: 1, d: { f: 1 }}, {b: 2}, {b: 3, c: 4}, {d: {e: 5, f: 2}})
 * result: {a: 1, b: 2, c: 4, d: { e: 5, f: 1}}
 * ```
 *
 * @param dest destination object.
 * @param sources params sources applied sequentially left to right.
 * @returns
 */
export const defaultsDeep = (dest: any, ...sources: any) => {
	if (sources == null) return dest

	// for each source
	for (let ix = 0; ix < sources.length; ix++) {
		const source = sources[ix]
		const keys = Object.keys(source)
		// for each key
		for (let kx = 0; kx < keys.length; kx++) {
			const key = keys[kx]
			if (typeof source[key] !== 'undefined') {
				if (typeof source[key] === 'object') {
					if (typeof dest[key] === 'undefined') dest[key] = {}
					else if (typeof dest[key] !== 'object') continue // bail; mismatching types
					dest[key] = defaultsDeep(dest[key], source[key])
				} else {
					if (typeof dest[key] === 'undefined') dest[key] = source[key]
				}
			}
		}
	}

	return dest
}

export default { defaults, defaultsDeep }
