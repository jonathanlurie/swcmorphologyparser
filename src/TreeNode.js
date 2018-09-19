import { SWC_TYPES } from "./Constants.js"


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
  constructor (id, type, x, y, z, r ) {
    this._id = id
    this._type = type
    this._position = [x, y, z]
    this._radius = r

    this._parent = null
    this._children = []

    this._hasSomaChildren = false
  }


  /**
   * Get the ID of _this_ node
   * @return {Number}
   */
  getId () {
    return this._id
  }


  /**
   * Get the type as a number (according to the SWC spec)
   * @return {Number}
   */
  getType () {
    return this._type
  }


  /**
   * @return {Boolean} true if this node is a soma, false if not
   */
  isSoma () {
    return (this._type === SWC_TYPES.SOMA)
  }

  /**
   * Get teh radius of _this_ node
   * @return {Number}
   */
  getRadius () {
    return this._radius
  }


  /**
   * Get the 3D coordinates of this node
   */
  getPosition () {
    return this._position
  }

  /**
   * Define the parent of _this_ node
   * @param {TreeNode} parent - the parent node
   */
  setParent (pNode) {
    this._parent = pNode
    pNode._addChild(this)
  }


  /**
   * Get the parent node of _this_ one
   * @return {TreeNode}
   */
  getParent () {
    return this._parent
  }


  /**
   * @private
   * Add a child to _this_ node
   * @param {TreeNode} cNode - a node to add as a child of _this_
   */
  _addChild (cNode) {
    if (!this.doesAlreadyHaveChild(cNode)) {
      this._children.push(cNode)

      this._hasSomaChildren = cNode.isSoma() || this._hasSomaChildren
    }
  }


  /**
   * Get all the chidren
   * @return {Array} array of TreeNode instances
   */
  getChildren () {
    return this._children
  }


  /**
   * Get all the children that are not soma points.
   * @return {Array} array of TreeNode instances
   */
  getNonSomaChildren () {
    if (!this._hasSomaChildren) {
      return this._children
    }

    let nonSomaChildren = []

    for (let i=0; i<this._children.length; i++) {
      if (!this._children[i].isSoma()) {
        nonSomaChildren.push(this._children[i])
      }
    }
    return nonSomaChildren
  }


  /**
   * Check is _this_ node already has the given child amond its list of children
   * @param {TreeNode} cNode - some node to test, most likely a potential child
   * @return {Boolean} true if this child is already present, false if not
   */
  doesAlreadyHaveChild (cNode) {
    for (let i=0; i<this._children.length; i++) {
      if (this._children[i].getId() === cNode.getId())
        return true
    }
    return false
  }


  /**
   * Dive into the TreeNode connection by following the children. Builds a list
   * all along. Stops when a node has no more children (end of branch) or when a
   * node has two children or more because it means it's a forking point.
   * What is returned in the end is an array that can be empty (if end of branch)
   * or with two or more TreeNode instance being the forking direction
   * @param {Array} nodeList - contains the previous TreeNode (parent, grand parents, etc.)
   * this array is only pushed to, nothing is taken or read from it.
   * @return {Array} of TreeNodes that are forking direction.
   */
  dive (nodeList) {
    // adding the current node on the list
    nodeList.push(this)

    let children = this.getNonSomaChildren()

    // this current node is in the middle of a sections, we go on...
    if (children.length === 1) {
      return children[0].dive()

    // this is or a ending point (no children) or a forking point (2 children or more).
    // In both case, this the end of a sections
    } else {
      return children
    }
  }

}

export { TreeNode }
