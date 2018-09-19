import { TreeNode } from "./TreeNode.js"


/**
 * A section is a list of TreeNode instances (each represent a point in 3D space).
 * A section can have children sections, meaning forking points. It should have
 * or 0 or 2 or more children but having 1 single child does not really make sense
 * because it would mean it just the continuation of _this_ section
 */
class Section {

  /**
   * @param {Number} a generated id (not tied to TreeNode ids)
   */
  constructor (id) {
    this._id = id
    this._nodes = []
    this._children = []
  }


  /**
   * Add a TreeNode isntance to the node list of _this_ sections. It will be added
   * at the end of the list.
   * @param {TreeNode} a  node to add
   */
  addNode (n) {
    this._node.push(n)
  }


  /**
   * Add a child section, meaning a forking point where _this_ section becomes 2
   * (or more) new sections
   */
  addChild (s) {
    this._children.push(s)
  }

}


export { Section }
