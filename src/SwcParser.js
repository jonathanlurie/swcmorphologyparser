import TreeNodeCollection from './TreeNodeCollection'


/**
 * An instance of SwcParser is made to parse SWC files with
 * [the given specification](http://www.neuronland.org/NLMorphologyConverter/MorphologyFormats/SWC/Spec.html).
 * The data output by this parser is a Javascript object representing a the tree
 * structure of the morphology. Each node of the tree is a section that contain a reference
 * to its parent section and references to its children sections.
 * The tree is given flat, meaning all the sections are at the same hierarchy
 * level within the JS object and every section is identified by an arbitrary ID.
 */
class SwcParser {
  constructor() {
    this._morphology = null
    this._rawMorphology = null
  }


  /**
   * Parses a SWC string. This SWC string is simply the text content of an SWC file.
   * This method does not return any reult (use one of the getters for that)
   * @param {String} swcStr - the string that comes from the SWC file
   */
  parse(swcStr) {
    this._morphology = null
    this._rawMorphology = null
    const rawPoints = SwcParser.extractPoints(swcStr)
    const treeNodeCollection = new TreeNodeCollection(rawPoints)
    
    this._morphology = treeNodeCollection.getMorphology()
    this._rawMorphology = treeNodeCollection.getRawMorphology()
    console.log('treeNodeCollection: ', treeNodeCollection)
    const type2Nodes = Object.values(treeNodeCollection._nodes).filter(n => n._type === 2)
    let aType2Node = type2Nodes[0]
    while (aType2Node._parent) {
      console.log(aType2Node)
      aType2Node = aType2Node._parent
    }
    console.log(aType2Node)


  }

  /**
   * Get the raw morphology flat tree
   * @return {Object} the soma and all the sections at the same level.
   * Still, all the info about parent/children are present
   */
  getRawMorphology() {
    return this._rawMorphology
  }

  /**
   * Get the morphology object, which is much easier to query than the raw morphology
   * @return {morphologycorejs.Morphology}
   *
   */
  getMorphology() {
    return this._morphology
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
  static extractPoints(swcStr) {
    // remove header/comments from SWC
    let result = swcStr.replace(/\s*#.*?$/mg, '')
    // remove empty lines and empty last line
    result = result.trim().replace(/^\s*$/mg, '')

    // store the data in memory-efficient typed arrays
    const lines = result.split('\n')
    const swcPoints = []

    for (let i = 0; i < lines.length; i += 1) {
      const row = lines[i].replace(/^\s+/m, '').replace(/\s+$/m, '').split(/[\s,]+/)
      if (row.length >= 7) {
        // allow for sloppy SWC that contains integers written as floats
        swcPoints[i] = [
          Math.round(parseFloat(row[0])),
          Math.round(parseFloat(row[1])),
          parseFloat(row[2]),
          parseFloat(row[3]),
          parseFloat(row[4]),
          parseFloat(row[5]),
          Math.round(parseFloat(row[6])),
        ]
      }
    }

    return swcPoints
  }
}

export default SwcParser
