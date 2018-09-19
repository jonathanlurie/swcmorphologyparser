import { TreeNode } from "./TreeNode.js"
import { SWC_TYPES } from "./Constants.js"


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
    this._buildSections()
  }


  /**
   * @private
   * Makes the list of nodes
   */
  _initCollection (points) {
    let somaNodes = []

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

      // The soma nodes: in addition to put them in the regular collection,
      // we also put them in a small collection we keep on the side
      if (points[i][1] === SWC_TYPES.SOMA) {
        somaNodes.push(aNode)
      }

      // In the SWC, a node/point seems to be always described after its parent,
      // so we can makes the parent/children links in the same loop
      let parentId = points[i][6]

      // the first point of the soma has no parent
      if (parentId === -1)
        continue

      let theParentNode = this._nodes[ parentId ]
      aNode.setParent( theParentNode )
    }

    console.log(somaNodes)
    console.log(this._nodes)
  }


  _buildSections () {
    let currentSectionId = 0
    let sections = {}

    // find the first point that has non-soma children:
    let currentNode = null
    for (let nodeId in this._nodes) {
      let currentPointChildren = this._nodes[nodeId].getNonSomaChildren()
      if (currentPointChildren.length > 0) {
        currentNode = this._nodes[nodeId]
        break
      }
    }

    if (!currentNode ) {
      console.warn("No valid section here")
      return
    }


    let branch = []
    branch.push(currentNode)
    let nexNodes = currentNode.dive(branch)


    //sections[currentSectionId] = new Section(currentSectionId)


  }


}

export { TreeNodeCollection }
