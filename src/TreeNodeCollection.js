import { TreeNode } from './TreeNode.js'


/**
 * A TreeNodeCollection instance builds all the TreeNode instances from the raw
 * points list from the SWC file. As a second step, it builds the parent/children
 * relations between the nodes and as a third step, define a list of sections.
 */
class TreeNodeCollection {

  /**
   * @param {Array} points - every points of the array is itself an Array of form:
   * [
   *     pointId: Number,
   *     pointType: Number,
   *     x: Number,
   *     y: Number,
   *     z: Number,
   *     radius: Number,
   *     parentId: Number
   *   ]
   */
  constructor (points) {
    this._nodes = {}

    this._initCollection(points)
  }


  /**
   * @private
   * Makes the list of nodes
   */
  _initCollection (points) {
    for (let i=0; i<points.length; i++) {
      let aNode = new TreeNode(
        points[i][0], // id
        points[i][1], // type
        points[i][2], // x
        points[i][3], // y
        points[i][4], // z
        points[i][5], // radius
      )

      this._nodes[points[i][0]] = aNode

      // In the SWC, a node/point seems to be always described after its parent,
      // so we can makes the parent/children links in the same loop
      let parentId = points[i][6]

      // the first point of the soma has no parent
      if (parentId === -1)
        continue

      let theParentNode = this._nodes[ parentId ]
      aNode.setParent( theParentNode )
    }

    console.log(this._nodes)
  }


}

export { TreeNodeCollection }
