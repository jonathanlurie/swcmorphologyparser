import { TreeNodeCollection } from './TreeNodeCollection.js'


class SwcParser {

  constructor () {

  }


  parse (swcStr) {
    let rawPoints = this._extractPoints(swcStr)
    let treeNodeCollection = new TreeNodeCollection(rawPoints)
  }


  /**
   * @private
   * build an Array of points from the SWC string.
   * Each element of the array is itself an Array representing a point and it's metadata.
   * A single point is an Array of form:
   *   [
   *     pointId: Number,
   *     pointType: Number,
   *     x: Number,
   *     y: Number,
   *     z: Number,
   *     radius: Number,
   *     parentId: Number
   *   ]
   * @param {String} swcStr - the string from the SWC file
   * @return {Array} all the points
   */
  _extractPoints (swcStr) {
    // remove header/comments from SWC
    let result = swcStr.replace(/\s*#.*?$/mg,'')
    // remove empty lines and empty last line
    result = result.trim().replace(/^\s*$/mg,'')

    // store the data in memory-efficient typed arrays
    let lines = result.split('\n')
    let swcPoints = []

    for (let i=0; i<lines.length; i++) {
      let row = lines[i].replace(/^\s+/m,'').replace(/\s+$/m,'').split(/[\s,]+/)
      if (row.length >= 7) {
        // allow for sloppy SWC that contains integers written as floats
        swcPoints[i] = [
          Math.round(parseFloat(row[0])),
          Math.round(parseFloat(row[1])),
          parseFloat(row[2]),
          parseFloat(row[3]),
          parseFloat(row[4]),
          parseFloat(row[5]),
          Math.round(parseFloat(row[6]))
        ]
      }
    }

    console.log(swcPoints)
    return swcPoints
  }


}

export { SwcParser }
