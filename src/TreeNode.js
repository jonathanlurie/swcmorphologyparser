import SWC_TYPES from './SWCTypes'

/**
 * A TreeNode instance represent a point from the SWC file. It has a 3D coordinate,
 * an ID, a type, a radius, a reference to a parent (which is also a TreeNode
 * instance) and a list of children (also TreeNode instances).
 *
 * **Ressources**
 * - [SWC Spec](http://www.neuronland.org/NLMorphologyConverter/MorphologyFormats/SWC/Spec.html)
 */
class TreeNode {
  /**
   * @param {Number} id - the id of the point
   * @param {Number} type - type of structure this point comes from (cf. SWC spec)
   * @param {Number} x - x component of the 3D coordinates
   * @param {Number} y - y component of the 3D coordinates
   * @param {Number} z - z component of the 3D coordinates
   * @param {Number} r - radius at this given point
   */
  constructor(id, type, x, y, z, r) {
    this._id = id
    this._type = type
    this._position = [x, y, z]
    this._radius = r

    this._parent = null
    this._parentId = null
    this._children = []
  }

  /**
   * Get the ID of _this_ node
   * @return {Number}
   */
  getId() {
    return this._id
  }

  /**
   * Get the type as a number (according to the SWC spec)
   * @return {Number}
   */
  getType() {
    return this._type
  }

  /**
   * @return {Boolean} true if this node is a soma, false if not
   */
  isSoma() {
    return (this._type === SWC_TYPES.SOMA)
  }

  /**
   * Get teh radius of _this_ node
   * @return {Number}
   */
  getRadius() {
    return this._radius
  }

  /**
   * Get the 3D coordinates of this node
   */
  getPosition() {
    return this._position
  }

  /**
   * Define the parent of _this_ node
   * @param {TreeNode} parent - the parent node
   */
  setParent(pNode) {
    this._parent = pNode
    pNode._addChild(this)
  }

  /**
   * Get the parent node of _this_ one
   * @return {TreeNode}
   */
  getParent() {
    return this._parent
  }


  /**
   * Set the id of the parent node.
   * This is mainly used as a temporary data before the parent object is actually set.
   * @param {Number} id
   */
  setParentId(id) {
    this._parentId = id
  }


  /**
   * Get the id of the parent.
   * This is mainly used as a temporary data before the parent object is actually set.
   * @return {Number}
   */
  getParentId() {
    return this._parentId
  }


  /**
   * @private
   * Add a child to _this_ node
   * @param {TreeNode} cNode - a node to add as a child of _this_
   */
  _addChild(cNode) {
    if (!this.doesAlreadyHaveChild(cNode)) {
      this._children.push(cNode)
    }
  }


  /**
   * Get all the chidren
   * @return {Array} array of TreeNode instances
   */
  getChildren() {
    return this._children
  }

  /**
   * Get all the children that are not soma points.
   * @return {Array} array of TreeNode instances
   */
  getNonSomaChildren() {
    return this._children.filter(c => !c.isSoma())
  }


  /**
   * Check is _this_ node already has the given child amond its list of children
   * @param {TreeNode} cNode - some node to test, most likely a potential child
   * @return {Boolean} true if this child is already present, false if not
   */
  doesAlreadyHaveChild(cNode) {
    for (let i = 0; i < this._children.length; i += 1) {
      if (this._children[i].getId() === cNode.getId()) { return true }
    }
    return false
  }

  /**
   * Dive into the TreeNode connection by following the children. Builds a list
   * all along. Stops when:
   * - a node has no more children (end of branch)
   * - a node has two children or more (forking point)
   * - a point is of another type as the starting one (eg. dendrite becomes axon)
   * What is returned in the end is an array that can be empty (if end of branch)
   * or with two or more TreeNode instance being the forking direction
   * @param {Array} nodeList - contains the previous TreeNode (parent, grand parents, etc.)
   * this array is only pushed to, nothing is taken or read from it.
   * @return {Array} of TreeNodes that are forking direction.
   */
  dive(nodeList) {
    // adding the current node on the list
    nodeList.push(this)

    const children = this.getChildren()

    // this current node is in the middle of a sections, we go on...
    if (children.length === 1 && children[0].getType() === this._type) {
      return children[0].dive(nodeList)
    }

    return children
  }
}

export default TreeNode
