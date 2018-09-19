
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

}

export { TreeNode }
