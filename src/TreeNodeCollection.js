import morphologycorejs from 'morphologycorejs'
import TreeNode from './TreeNode'
import SWC_TYPES from './SWCTypes'

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
  constructor(points) {
    this._nodes = {}
    this._rawSoma = null
    this._rawSections = null
    this._rawMorphology = null
    this._morphology = null
    this._initCollection(points)
    this._buildSections()
    this._buildMorphologyObjects()
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
   * Makes the list of nodes
   */
  _initCollection(points) {
    const somaNodes = []

    for (let i = 0; i < points.length; i += 1) {
      const aNode = new TreeNode(
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
      const parentId = points[i][6]

      // the first point of the soma has no parent
      if (parentId === -1) { continue }

      // just setting the parent id because the parent object might be declared later on the list
      // and thus not exist yet as an object.
      aNode.setParentId(parentId)
    }

    // setting the parent node object happens in a second pass to ensure all the node are
    // created before any node association is done.
    Object.values(this._nodes).forEach((n) => {
      const parentId = n.getParentId()

      if (parentId === null) {
        return
      }

      n.setParent(this._nodes[parentId])
    })


    // build the soma if we have some soma points
    if (somaNodes.length) {
      this._rawSoma = {
        id: 0, // just to have the same format as the NeuroM converter
        type: 'soma',
        // the radius are usually all the same, but just in case, we take the largest one
        radius: Math.max(...somaNodes.map(n => n.getRadius())),
        points: somaNodes.map(n => ({ position: n.getPosition() })),
      }
    }
  }

  /**
   * @private
   * Reconstruct all the section from the nodes, give them IDs and establish the
   * parent/children relationship
   */
  _buildSections() {
    let currentSectionId = 0
    const sections = []

    // find the first node that has non-soma children:
    let firstValidNode = null
    let firstValidChildren = []

    const allNodeIds = Object.keys(this._nodes)
    for (let i = 0; i < allNodeIds.length; i += 1) {
      const nodeId = allNodeIds[i]
      const childrenOfNode = this._nodes[nodeId].getNonSomaChildren()
      if (childrenOfNode.length > 0) {
        firstValidNode = this._nodes[nodeId]
        firstValidChildren = childrenOfNode
        break
      }
    }

    if (!firstValidNode) {
      console.warn('No valid section here')
      return
    }

    const stack = []

    // add all the children of the firstValidNode into the stack
    for (let i = 0; i < firstValidChildren.length; i += 1) {
      stack.push({
        node: firstValidChildren[i],
        parentSectionId: null,
      })
    }

    function buildRawSection(startingNode, parentSectionId) {
      // the nodeList is the list of node for the section we are building.
      // Let's say it's just a simpler version of the future section object
      const nodeList = []

      // for each starting node, we actually have to start by adding its parent
      // to start the branch from its very basis
      if (startingNode.getParent()) {
        nodeList.push(startingNode.getParent())
      }

      // nodeList.push(startingNode)
      // let nextNodes = startingNode.getNonSomaChildren()[0].dive(nodeList)

      const nextNodes = startingNode.dive(nodeList)

      const points = nodeList.map(n => ({
        position: n.getPosition(),
        radius: n.getRadius(),
      }))

      // if the first point is a soma point, we dont keep the first radius
      // because it's the radius of the soma
      if (parentSectionId === null && points.length) {
        points[0].radius = 0
      }

      // now nodeList is full of nodes
      const section = {
        typevalue: startingNode.getType(),
        points,
        id: currentSectionId,
        children: [],
        parent: parentSectionId,
      }

      // adding this section as a child of its parent
      // (this is made possible because the parents are always defined before their children)
      if (parentSectionId) {
        sections[parentSectionId].children.push(currentSectionId)
      }

      // adding the next nodes as new section starting points
      for (let i = 0; i < nextNodes.length; i += 1) {
        stack.push({
          node: nextNodes[i],
          parentSectionId: currentSectionId,
        })
      }

      currentSectionId += 1
      return section
    }

    // popping the stack
    while (stack.length) {
      const stackElem = stack.pop()
      const section = buildRawSection(stackElem.node, stackElem.parentSectionId)
      sections.push(section)
      sections[section.id] = section
    }

    if (sections.length) {
      this._rawSections = sections
    }
  }

  /**
   * @private
   * Performs some verification and then assemble the raw morphology
   */
  _buildMorphologyObjects() {
    // it's ok to not have any section
    if (!this._rawSections) {
      console.warn('This morphology has no section to export')
    }

    // it's ok to not have a soma
    if (!this._rawSoma) {
      console.warn('This morphology has no soma to show')
    }

    // but it's not ok to have nothing at all
    if (!this._rawSections && !this._rawSoma) {
      console.warn('No valid morphology data.')
      return
    }

    this._rawMorphology = {
      soma: this._rawSoma,
      sections: this._rawSections,
    }

    this._morphology = new morphologycorejs.Morphology()
    this._morphology.buildFromRawMorphology(this._rawMorphology)
  }
}

export default TreeNodeCollection
