import morphologycorejs from 'morphologycorejs';

/*
 * Defines the SWC standard types as in http://www.neuronland.org/NLMorphologyConverter/MorphologyFormats/SWC/Spec.html
 */
var SWC_TYPES = {
  UNDEFINED: 0,
  SOMA: 1,
  AXON: 2,
  BASAL_DENDRITE: 3,
  APICAL_DENDRITE: 4,
  CUSTOM: 5,
};

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
    this._id = id;
    this._type = type;
    this._position = [x, y, z];
    this._radius = r;

    this._parent = null;
    this._parentId = null;
    this._children = [];
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
    this._parent = pNode;
    pNode._addChild(this);
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
    this._parentId = id;
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
      this._children.push(cNode);
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
   * all along. Stops when a node has no more children (end of branch) or when a
   * node has two children or more because it means it's a forking point.
   * What is returned in the end is an array that can be empty (if end of branch)
   * or with two or more TreeNode instance being the forking direction
   * @param {Array} nodeList - contains the previous TreeNode (parent, grand parents, etc.)
   * this array is only pushed to, nothing is taken or read from it.
   * @return {Array} of TreeNodes that are forking direction.
   */
  dive(nodeList) {
    // adding the current node on the list
    nodeList.push(this);

    const children = this.getNonSomaChildren();

    // this current node is in the middle of a sections, we go on...
    if (children.length === 1) {
      if (children[0].getType() === this._type) {
        return children[0].dive(nodeList)
      }
      console.warn(`Non-soma node (id:${this._id} type:${this._type}) has a single child of different type (id:${children[0].getId()} type:${this.getType()})`);


    // this is or a ending point (no children) or a forking point (2 children or more).
    // In both case, this the end of a sections
    } else {
      return children
    }

    return []
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
  constructor(points) {
    this._nodes = {};
    this._rawSoma = null;
    this._rawSections = null;
    this._rawMorphology = null;
    this._morphology = null;
    this._initCollection(points);
    this._buildSections();
    this._buildMorphologyObjects();
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
    const somaNodes = [];

    for (let i = 0; i < points.length; i += 1) {
      const aNode = new TreeNode(
        points[i][0], // id
        points[i][1], // type
        points[i][2], // x
        points[i][3], // y
        points[i][4], // z
        points[i][5], // radius
      );

      this._nodes[points[i][0]] = aNode;

      // The soma nodes: in addition to put them in the regular collection,
      // we also put them in a small collection we keep on the side
      if (points[i][1] === SWC_TYPES.SOMA) {
        somaNodes.push(aNode);
      }

      // In the SWC, a node/point seems to be always described after its parent,
      // so we can makes the parent/children links in the same loop
      const parentId = points[i][6];

      // the first point of the soma has no parent
      if (parentId === -1) { continue }

      // just setting the parent id because the parent object might be declared later on the list
      // and thus not exist yet as an object.
      aNode.setParentId(parentId);
    }

    
    // setting the parent node object happens in a second pass to ensure all the node are
    // created before any node association is done.
    Object.values(this._nodes).forEach((n) => {
      const parentId = n.getParentId();

      if (parentId === null) {
        return
      }

      n.setParent(this._nodes[parentId]);
    });

    // build the soma if we have some soma points
    if (somaNodes.length) {
      this._rawSoma = {
        id: 0, // just to have the same format as the NeuroM converter
        type: 'soma',
        // the radius are usually all the same, but just in case, we take the largest one
        radius: Math.max(...somaNodes.map(n => n.getRadius())),
        points: somaNodes.map(n => ({ position: n.getPosition() })),
      };
    }
  }

  /**
   * @private
   * Reconstruct all the section from the nodes, give them IDs and establish the
   * parent/children relationship
   */
  _buildSections() {
    let currentSectionId = 0;
    const sections = [];

    // find the first node that has non-soma children:
    let firstValidNode = null;
    let firstValidChildren = [];

    const allNodeIds = Object.keys(this._nodes);
    for (let i = 0; i < allNodeIds.length; i += 1) {
      const nodeId = allNodeIds[i];
      const childrenOfNode = this._nodes[nodeId].getNonSomaChildren();
      if (childrenOfNode.length > 0) {
        firstValidNode = this._nodes[nodeId];
        firstValidChildren = childrenOfNode;
        break
      }
    }

    if (!firstValidNode) {
      console.warn('No valid section here');
      return
    }

    const stack = [];

    // add all the children of the firstValidNode into the stack
    for (let i = 0; i < firstValidChildren.length; i += 1) {
      stack.push({
        node: firstValidChildren[i],
        parentSectionId: null,
      });
    }

    function buildRawSection(startingNode, parentSectionId) {
      // the nodeList is the list of node for the section we are building.
      // Let's say it's just a simpler version of the future section object
      const nodeList = [];

      // for each starting node, we actually have to start by adding its parent
      // to start the branch from its very basis
      if (startingNode.getParent()) {
        nodeList.push(startingNode.getParent());
      }

      // nodeList.push(startingNode)
      // let nextNodes = startingNode.getNonSomaChildren()[0].dive(nodeList)

      const nextNodes = startingNode.dive(nodeList);

      const points = nodeList.map(n => ({
        position: n.getPosition(),
        radius: n.getRadius(),
      }));

      // if the first point is a soma point, we dont keep the first radius
      // because it's the radius of the soma
      if (parentSectionId === null && points.length) {
        points[0].radius = 0;
      }

      // now nodeList is full of nodes
      const section = {
        typevalue: startingNode.getType(),
        points,
        id: currentSectionId,
        children: [],
        parent: parentSectionId,
      };

      // adding this section as a child of its parent
      // (this is made possible because the parents are always defined before their children)
      if (parentSectionId) {
        sections[parentSectionId].children.push(currentSectionId);
      }

      // adding the next nodes as new section starting points
      for (let i = 0; i < nextNodes.length; i += 1) {
        stack.push({
          node: nextNodes[i],
          parentSectionId: currentSectionId,
        });
      }

      currentSectionId += 1;
      return section
    }

    // popping the stack
    while (stack.length) {
      const stackElem = stack.pop();
      const section = buildRawSection(stackElem.node, stackElem.parentSectionId);
      sections.push(section);
      sections[section.id] = section;
    }

    if (sections.length) {
      this._rawSections = sections;
    }
  }

  /**
   * @private
   * Performs some verification and then assemble the raw morphology
   */
  _buildMorphologyObjects() {
    // it's ok to not have any section
    if (!this._rawSections) {
      console.warn('This morphology has no section to export');
    }

    // it's ok to not have a soma
    if (!this._rawSoma) {
      console.warn('This morphology has no soma to show');
    }

    // but it's not ok to have nothing at all
    if (!this._rawSections && !this._rawSoma) {
      console.warn('No valid morphology data.');
      return
    }

    this._rawMorphology = {
      soma: this._rawSoma,
      sections: this._rawSections,
    };

    this._morphology = new morphologycorejs.Morphology();
    this._morphology.buildFromRawMorphology(this._rawMorphology);
  }
}

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
    this._morphology = null;
    this._rawMorphology = null;
  }


  /**
   * Parses a SWC string. This SWC string is simply the text content of an SWC file.
   * This method does not return any reult (use one of the getters for that)
   * @param {String} swcStr - the string that comes from the SWC file
   */
  parse(swcStr) {
    this._morphology = null;
    this._rawMorphology = null;
    const rawPoints = SwcParser.extractPoints(swcStr);
    const treeNodeCollection = new TreeNodeCollection(rawPoints);
    this._morphology = treeNodeCollection.getMorphology();
    this._rawMorphology = treeNodeCollection.getRawMorphology();
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
    let result = swcStr.replace(/\s*#.*?$/mg, '');
    // remove empty lines and empty last line
    result = result.trim().replace(/^\s*$/mg, '');

    // store the data in memory-efficient typed arrays
    const lines = result.split('\n');
    const swcPoints = [];

    for (let i = 0; i < lines.length; i += 1) {
      const row = lines[i].replace(/^\s+/m, '').replace(/\s+$/m, '').split(/[\s,]+/);
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
        ];
      }
    }

    return swcPoints
  }
}

var index = ({
  SwcParser,
});

export default index;
//# sourceMappingURL=swcmorphologyparser.js.map
