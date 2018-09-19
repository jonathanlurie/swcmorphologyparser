(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.swcmorphologyparser = {})));
}(this, (function (exports) { 'use strict';

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
      this._id = id;
      this._type = type;
      this._position = [x, y, z];
      this._radius = r;

      this._parent = null;
      this._children = [];
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
      this._parent = pNode;
      pNode._addChild(this);
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
        this._children.push(cNode);
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
      this._nodes = {};

      this._initCollection(points);
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
        );

        this._nodes[points[i][0]] = aNode;

        // In the SWC, a node/point seems to be always described after its parent,
        // so we can makes the parent/children links in the same loop
        let parentId = points[i][6];

        // the first point of the soma has no parent
        if (parentId === -1)
          continue

        let theParentNode = this._nodes[ parentId ];
        aNode.setParent( theParentNode );
      }

      console.log(this._nodes);
    }


  }

  class SwcParser {

    constructor () {

    }


    parse (swcStr) {
      let rawPoints = this._extractPoints(swcStr);
      let treeNodeCollection = new TreeNodeCollection(rawPoints);
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
      let result = swcStr.replace(/\s*#.*?$/mg,'');
      // remove empty lines and empty last line
      result = result.trim().replace(/^\s*$/mg,'');

      // store the data in memory-efficient typed arrays
      let lines = result.split('\n');
      let swcPoints = [];

      for (let i=0; i<lines.length; i++) {
        let row = lines[i].replace(/^\s+/m,'').replace(/\s+$/m,'').split(/[\s,]+/);
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
          ];
        }
      }

      console.log(swcPoints);
      return swcPoints
    }


  }

  exports.SwcParser = SwcParser;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=swcmorphologyparser.js.map
