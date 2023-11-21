import { defaults, defaultsDeep } from './defaults.mjs'

describe('defaults', () => {
	test('basic flat object', async () => {
		const result = defaults({}, { one: 1, two: 2, three: 'three' })
		expect(result).to.deep.eq({ one: 1, two: 2, three: 'three' })
	})

	test('deep object (value exists), shallow defaults', async () => {
		const four = { four: 4 }
		const result = defaults({ four }, { one: 1, two: 2, three: 'three', four: { four: 4, five: 5 } })
		expect(result).to.deep.eq({ one: 1, two: 2, three: 'three', four: { four: 4 } })
		expect(result.four).to.equal(four) // strict equal by ref
		expect(result.four.five).to.not.be.ok
	})

	test('deep object (value null), shallow defaults', async () => {
		const four = { four: 4, five: 5 }
		const result = defaults({}, { one: 1, two: 2, three: 'three', four })
		expect(result).to.deep.eq({ one: 1, two: 2, three: 'three', four: { four: 4, five: 5 } })
		expect(result.four).to.equal(four) // strict equal by ref
		expect(result.four.five).to.be.ok
	})
})

describe('defaultsDeep', () => {
	test('basic flat object', async () => {
		const result = defaultsDeep({}, { one: 1, two: 2, three: 'three' })
		expect(result).to.deep.eq({ one: 1, two: 2, three: 'three' })
	})

	test('deep object (value exists), deep defaults', async () => {
		const four = { four: 4 }
		const result = defaultsDeep({ four }, { one: 1, two: 2, three: 'three', four: { four: 4, five: 5 } })
		expect(result).to.eql({ one: 1, two: 2, three: 'three', four: { four: 4, five: 5 } })
		expect(result.four).to.equal(four) // strict equal by ref; but we're adding prop five to it.
		expect(result.four.five).to.be.ok // should bring in five.
	})

	test('deep object (value null), deep defaults', async () => {
		const four = { four: 4, five: 5 }
		const result = defaultsDeep({}, { one: 1, two: 2, three: 'three', four })
		expect(result).to.deep.equal({ one: 1, two: 2, three: 'three', four: { four: 4, five: 5 } })
		expect(result.four).to.not.equal(four) // strict NON equal by ref
		expect(result.four.five).to.be.ok
	})

	test('deep object (value null), deep defaults, mismatching types', async () => {
		const four = { four: 4, five: 5 }
		const result = defaultsDeep({ four: 4 }, { one: 1, two: 2, three: 'three', four })
		expect(result).to.deep.equal({ one: 1, two: 2, three: 'three', four: 4 })
		expect(result.four).to.not.equal(four) // strict NON equal by ref
		expect(result.four.five).to.not.be.ok
	})

	test('deep object (value null), deep defaults, mismatching types', async () => {
		const result = defaultsDeep({ a: 1, d: { f: 1 } }, { b: 2 }, { b: 3, c: 4 }, { d: { e: 5, f: 2 } })
		expect(result).to.deep.equal({ a: 1, b: 2, c: 4, d: { e: 5, f: 1 } })
	})
})
