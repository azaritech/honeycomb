import { expect } from 'chai'
import sinon from 'sinon'

import createHexFactory from '../../src/hex'
import createGridFactoryFactory from '../../src/grid'
import * as methods from '../../src/grid/prototype'

const Hex = createHexFactory()
const GridFactory = createGridFactoryFactory({ createHexFactory })(Hex)

describe('get', () => {
    describe('when present in the grid', () => {
        it('returns the passed hex', () => {
            const targetHex = Hex(3, -2)
            const get = methods.get.bind(GridFactory(targetHex))
            const result = get(Hex(3, -2))

            expect(result).to.equal(targetHex)
        })
    })

    describe('when not present in the grid', () => {
        it('returns the passed hex', () => {
            const targetHex = Hex(3, -2)
            const get = methods.get.bind(GridFactory(targetHex))
            const result = get(Hex())

            expect(result).to.be.undefined
        })
    })
})

describe('hexesBetween', () => {
    it('calls the passed firstHex.distance()', () => {
        const distance = sinon.stub()
        const firstHex = { distance }
        const lastHex = 'last hex'
        methods.hexesBetween(firstHex, lastHex)

        expect(distance).to.have.been.calledWith(lastHex)
    })

    it('calls firstHex.nudge(), firstHex.lerp(), lastHex.nudge() and firstHex.round() for each hex between firstHex and lastHex', () => {
        const round = sinon.stub().returns('round result')
        const lerp = sinon.stub().returns({ round })
        const firstHexNudge = sinon.stub().returns({ lerp })
        const lastHexNudge = sinon.stub().returns('last hex nudge result')
        const distance = sinon.stub().returns(2)
        const firstHex = { distance, nudge: firstHexNudge }
        const lastHex = { nudge: lastHexNudge }
        const get = sinon.stub().returns('get result')
        const hexesBetween = methods.hexesBetween.bind({ get })
        const result = hexesBetween(firstHex, lastHex)

        expect(firstHexNudge).to.have.callCount(3)
        expect(lerp).to.have.callCount(3)
        expect(lerp).to.always.have.been.calledWith('last hex nudge result', sinon.match.number)
        expect(lastHexNudge).to.have.callCount(3)
        expect(round).to.have.callCount(3)
        expect(get).to.have.callCount(3)
        expect(get).to.always.have.been.calledWith('round result')
        expect(result).to.eql(['get result', 'get result', 'get result'])
    })

    describe('when all hexes between firstHex and lastHex are present in the grid', () => {
        it('returns the hexes in a straight line, inclusive', () => {
            const grid = GridFactory.rectangle({ width: 4, height: 2 })
            const result = grid.hexesBetween(Hex(), Hex(3, 1))

            expect(result).to.be.an('array').that.has.a.lengthOf(5)
            expect(result[0]).to.equal(grid[0])
            expect(result[1]).to.equal(grid[1])
            expect(result[2]).to.equal(grid[2])
            expect(result[3]).to.equal(grid[6])
            expect(result[4]).to.equal(grid[7])
        })
    })

    describe('when some hexes between firstHex and lastHex are missing in the grid', () => {
        it('returns any present hexes in a straight line, inclusive', () => {
            const grid = GridFactory.rectangle({ width: 3, height: 2 })
            const firstHex = Hex()
            const lastHex = Hex(3, 1)
            const result = grid.hexesBetween(firstHex, lastHex)

            expect(result).to.be.an('array').that.has.a.lengthOf(5)
            expect(result[0]).to.equal(grid[0])
            expect(result[1]).to.equal(grid[1])
            expect(result[2]).to.equal(grid[2])
            expect(result[3]).to.equal(grid[5])
            expect(result[4]).to.be.undefined
        })
    })
})

describe('neighborOf', () => {
    let neighborOf, cubeToCartesian, hex, get

    beforeEach(() => {
        cubeToCartesian = sinon.stub().returns('cubeToCartesian result')
        hex = { cubeToCartesian, q: 1, r: 1 }
        get = sinon.spy()
        neighborOf = methods.neighborOf.bind({ get })
    })

    it('throws when no hex is passed', () => {
        expect(() => neighborOf()).to.throw(`Cannot find neighbor of hex: undefined.`)
    })

    it('accepts 3 parameters or an options object', () => {
        neighborOf(hex, 2, true)
        expect(cubeToCartesian).to.have.been.calledWith({ q: 0, r: 3 })

        neighborOf({ hex, direction: 2, diagonal: true })
        expect(cubeToCartesian).to.have.been.calledWith({ q: 0, r: 3 })
    })

    it('calls grid.get() with the result of hex.cubeToCartesian()', () => {
        neighborOf(hex)
        expect(get).to.have.been.calledWith('cubeToCartesian result')
    })

    describe('with a given direction between 0 and 5', () => {
        it(`calls the passed hex.cubeToCartesian() with the hex's cube coordinates and the passed direction coordinates`, () => {
            neighborOf(hex, 0)
            expect(cubeToCartesian).to.have.been.calledWith({ q: 2, r: 1 })
            neighborOf(hex, 1)
            expect(cubeToCartesian).to.have.been.calledWith({ q: 1, r: 2 })
            neighborOf(hex, 2)
            expect(cubeToCartesian).to.have.been.calledWith({ q: 0, r: 2 })
            neighborOf(hex, 3)
            expect(cubeToCartesian).to.have.been.calledWith({ q: 0, r: 1 })
            neighborOf(hex, 4)
            expect(cubeToCartesian).to.have.been.calledWith({ q: 1, r: 0 })
            neighborOf(hex, 5)
            expect(cubeToCartesian).to.have.been.calledWith({ q: 2, r: 0 })
        })
    })

    describe('with a given direction < 0 or > 5', () => {
        it(`calls the passed hex.cubeToCartesian() with the hex's cube coordinates and the remainder of the passed direction coordinates`, () => {
            neighborOf(hex, 6)
            expect(cubeToCartesian).to.have.been.calledWith({ q: 2, r: 1 })
            neighborOf(hex, 92)
            expect(cubeToCartesian).to.have.been.calledWith({ q: 0, r: 2 })
            neighborOf(hex, -4)
            expect(cubeToCartesian).to.have.been.calledWith({ q: 0, r: 2 })
        })
    })

    describe('with the diagonal flag enabled', () => {
        it(`calls the passed hex.cubeToCartesian() with the hex's cube coordinates and the passed diagonal direction coordinates`, () => {
            neighborOf(hex, 0, true)
            expect(cubeToCartesian).to.have.been.calledWith({ q: 3, r: 0 })
            neighborOf(hex, 1, true)
            expect(cubeToCartesian).to.have.been.calledWith({ q: 2, r: 2 })
            neighborOf(hex, 2, true)
            expect(cubeToCartesian).to.have.been.calledWith({ q: 0, r: 3 })
            neighborOf(hex, 3, true)
            expect(cubeToCartesian).to.have.been.calledWith({ q: -1, r: 2 })
            neighborOf(hex, 4, true)
            expect(cubeToCartesian).to.have.been.calledWith({ q: 0, r: 0 })
            neighborOf(hex, 5, true)
            expect(cubeToCartesian).to.have.been.calledWith({ q: 2, r: -1 })
        })
    })

    describe('when the neighbor is present in the grid', () => {
        it('returns the neighbor', () => {
            const grid = GridFactory.hexagon({ radius: 1 })
            const hex = Hex()
            const result = grid.neighborOf(hex)

            expect(result).to.equal(grid[6])
        })
    })

    describe('when the neighbor is not present in the grid', () => {
        it('returns undefined', () => {
            const grid = GridFactory()
            const hex = Hex()
            const result = grid.neighborOf(hex)

            expect(result).to.be.undefined
        })
    })
})

describe('neighborsOf', () => {
    let neighborsOf, cubeToCartesian, hex, get

    beforeEach(() => {
        cubeToCartesian = sinon.stub().returns('cubeToCartesian result')
        hex = { cubeToCartesian, q: 1, r: 1 }
        get = sinon.spy()
        neighborsOf = methods.neighborsOf.bind({ get })
    })

    it('throws when no hex is passed', () => {
        expect(() => neighborsOf()).to.throw(`Cannot find neighbors of hex: undefined.`)
    })

    it('accepts 2 parameters or an options object', () => {
        neighborsOf(hex, true)
        expect(cubeToCartesian).to.have.callCount(6)

        cubeToCartesian.reset()

        neighborsOf({ hex, diagonal: true })
        expect(cubeToCartesian).to.have.callCount(6)
    })

    it('calls grid.get() with the result of hex.cubeToCartesian() for each direction', () => {
        neighborsOf(hex)
        expect(get.callCount).to.equal(6)
        expect(get).to.always.have.been.calledWith('cubeToCartesian result')
    })

    it(`calls the passed hex.cubeToCartesian() with the sum of the passed hex's cube coordinates and each direction coordinates`, () => {
        neighborsOf(hex)
        expect(cubeToCartesian.getCall(0).args[0]).to.eql({ q: 2, r: 1 })
        expect(cubeToCartesian.getCall(1).args[0]).to.eql({ q: 1, r: 2 })
        expect(cubeToCartesian.getCall(2).args[0]).to.eql({ q: 0, r: 2 })
        expect(cubeToCartesian.getCall(3).args[0]).to.eql({ q: 0, r: 1 })
        expect(cubeToCartesian.getCall(4).args[0]).to.eql({ q: 1, r: 0 })
        expect(cubeToCartesian.getCall(5).args[0]).to.eql({ q: 2, r: 0 })
    })

    describe('with the diagonal flag enabled', () => {
        it(`calls the passed hex.cubeToCartesian() with the sum of the passed hex's cube coordinates and each direction coordinates`, () => {
            neighborsOf(hex, true)
            expect(cubeToCartesian.getCall(0).args[0]).to.eql({ q: 3, r: 0 })
            expect(cubeToCartesian.getCall(1).args[0]).to.eql({ q: 2, r: 2 })
            expect(cubeToCartesian.getCall(2).args[0]).to.eql({ q: 0, r: 3 })
            expect(cubeToCartesian.getCall(3).args[0]).to.eql({ q: -1, r: 2 })
            expect(cubeToCartesian.getCall(4).args[0]).to.eql({ q: 0, r: 0 })
            expect(cubeToCartesian.getCall(5).args[0]).to.eql({ q: 2, r: -1 })
        })
    })

    describe('when all neighbors are present in the grid', () => {
        it('returns all neighbors', () => {
            const grid = GridFactory.hexagon({ radius: 1 })
            const result = grid.neighborsOf(Hex())

            expect(result).to.be.an('array').that.has.a.lengthOf(6)
            expect(result[0]).to.equal(grid[6])
            expect(result[1]).to.equal(grid[4])
            expect(result[2]).to.equal(grid[1])
            expect(result[3]).to.equal(grid[0])
            expect(result[4]).to.equal(grid[2])
            expect(result[5]).to.equal(grid[5])
        })
    })

    describe('when some neighbors are not present in the grid', () => {
        it('returns only the present neighbors', () => {
            const grid = GridFactory.hexagon({ radius: 1 })
            const hex = Hex(1, 0)
            const result = grid.neighborsOf(hex)

            expect(result).to.be.an('array').that.has.a.lengthOf(3)
            expect(result[0]).to.equal(grid[4])
            expect(result[1]).to.equal(grid[3])
            expect(result[2]).to.equal(grid[5])
        })
    })
})
