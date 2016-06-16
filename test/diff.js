import fs from 'fs'
import path from 'path'
import {expect} from 'chai'
import diff from '../src/diff'

const sourcePath = path.join(__dirname, 'diff-source.css')
const reversedPath = path.join(__dirname, 'diff-reversed.css')
const resultPath = path.join(__dirname, 'diff-result.css')

describe('Diff', () => {
  it('should return only the diff', () => {
    const source = fs.readFileSync(sourcePath, 'utf-8')
    const reversed = fs.readFileSync(reversedPath, 'utf-8')
    const expected = fs.readFileSync(resultPath, 'utf-8')

    const output = diff(source, reversed)
    expect(output).to.equal(expected)
  })
})
