(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.swcmorphologyparser = factory());
}(this, (function () { 'use strict';

  /*
  * Author   Jonathan Lurie - http://me.jonathanlurie.fr
  * License  Apache License 2.0
  * Lab      Blue Brain Project, EPFL
  */


  /*
  Standardized swc files (www.neuromorpho.org)
  0 - undefined
  1 - soma
  2 - axon
  3 - (basal) dendrite
  4 - apical dendrite
  5+ - custom
  */
  const TYPEVALUE_2_TYPENAME = {
    0: 'undefined',
    1: 'soma',
    2: 'axon',
    3: 'basal_dendrite',
    4: 'apical_dendrite',
    5: 'custom',
  };

  const TYPENAME_2_TYPEVALUE = {
    undefined: 0,
    soma: 1,
    axon: 2,
    basal_dendrite: 3,
    apical_dendrite: 4,
    custom: 5,
  };


  /**
   * A section is a list of 3D points and some metadata. A section can have one parent
   * and multiple children when the dendrite or axone divide into mutliple dendrites
   * and axons.
   * A section instance can be built from scratch of it can be built using a raw object,
   * usually from a JSON description.
   */
  class Section {
    /**
     * To construct a section, we need a reference to the morphology instance that
     * 'hosts' them. This may seem a bit a bit counter intuitive to have a reference
     * in that direction but it can be very convenient, when knowing a section, to
     * know to which morphology it belongs (i.e. raycasting a section)
     * @param {Morphology} morphology - the Morphology instance that host _this_ section
     */
    constructor(morphology = null) {
      this._id = null;
      this._parent = null;
      this._children = [];
      this._typename = null;
      this._typevalue = null;
      this._points = null;
      this._radiuses = null;
      this._morphology = morphology;
    }


    /**
     * Defines the id of this seciton.
     * Note: should probably not be used after `initWithRawSection` because then
     * sections already have ids and chance to messup the id game are pretty high.
     * @param {String|Number} id - the id
     */
    setId(id) {
      this._id = id;
    }


    /**
     * Get the id of _this_ section
     * @return {String|Number}
     */
    getId() {
      return this._id
    }


    /**
     * Define the typename, like in the SWC spec. Must be one of:
     *  - "undefined"
     *  - "soma" (even though this one should be used to build a Soma instance)
     *  - "axon"
     *  - "basal_dendrite"
     *  - "apical_dendrite"
     *  - "custom"
     * Not that this method automaically sets the typevalue accordingly.
     * For more info, go to http://www.neuronland.org/NLMorphologyConverter/MorphologyFormats/SWC/Spec.html
     * @param {String} tn - the typename
     */
    setTypename(tn) {
      if (tn in TYPENAME_2_TYPEVALUE) {
        this._typename = tn;
        this._typevalue = TYPENAME_2_TYPEVALUE[tn];
      } else {
        console.warn(`The typename must be one of ${Object.key(TYPENAME_2_TYPEVALUE).join(' ')}`);
      }
    }


    /**
     * Get the typename as a String
     * @return {String}
     */
    getTypename() {
      return this._typename
    }


    /**
     * Defnies the typevalue, which is the integer that goes in pair with the type name.
     * According to SWC spec. Must be one of:
     * - 0, for undefined
     * - 1, for soma (even though this one should be used to build a Soma instance)
     * - 2, for axon
     * - 3, for basal dendrite
     * - 4, for apical dendrite
     * - 5, for custom
     * Note that defining the type value will automatically set the type name accordingly.
     * @param {Number} tv - the type value
     */
    setTypeValue(tv) {
      this._typevalue = tv;
    }


    /**
     * Get the type value
     * @return {Number}
     */
    getTypevalue() {
      return this._typevalue
    }


    /**
     * Add a point to _this_ current section
     * @param {Number} x - the x coordinate of the point to add
     * @param {Number} y - the y coordinate of the point to add
     * @param {Number} z - the z coordinate of the point to add
     * @param {Number} r - the radius at the point to add. (default: 1)
     */
    addPoint(x, y, z, r = 1) {
      this._points.push([x, y, z]);
      this._radiuses.push(r);
    }


    /**
     * Get all the points of _this_ section as an array
     * @return {Array} each element are of form [x: Number, y: Number, y: Number]
     */
    getPoints() {
      return this._points
    }


    /**
     * Get all the radiuses of the point in _this_ section
     * @return {Array}
     */
    getRadiuses() {
      return this._radiuses
    }


    /**
     * Build a section using a raw section object.
     * @param {Object} rawSection - usually comes from a JSON file
     */
    initWithRawSection(rawSection) {
      this._id = rawSection.id;

      this._points = rawSection.points.map(p => p.position);
      this._radiuses = rawSection.points.map(p => p.radius);

      // in some cases, we have only the typename or the typevalue, in this case we perform  a lookup
      if (rawSection.typename || rawSection.typevalue) {
        this._typename = rawSection.typename || TYPEVALUE_2_TYPENAME[rawSection.typevalue];
        this._typevalue = rawSection.typevalue || TYPENAME_2_TYPEVALUE[rawSection.typename];
      }

      return this._id
    }


    /**
     * Define the parent section of _this_ section, as an object reference.
     * The only verification perfomed by this method is that a section is not added
     * as its own parent.
     * @param {Section} section - the section that is the parent of this one
     * @return {Boolean} true if parent was successfully defined, false if not.
     */
    setParent(section) {
      if (section && section.getId() !== this._id) {
        this._parent = section;
        return true
      }

      console.warn('A section cannot be the parent of itself.');
      return false
    }


    /**
     * Get the parent section of _this_ section
     * @return {Section} the parent
     */
    getParent() {
      return this._parent
    }


    /**
     * Make a given section the child of _this_ one.
     * Two verifications are perfomed before: ids must be diferent so that we are
     * not allowing a section to be the child of itself, and that _this_ section
     * does not already have the given section as a children (=> avoid doublons)
     * @param {Section} section - The section to add as a child
     * @return {Boolean} true if successfully added (of if already has the given child),
     * false if the candidate cannot be a child
     */
    addChild(section) {
      if (section.getId() !== this._id) {
        if (this.hasChild(section)) {
          console.warn('The given section is already one of the child to this one.');
        } else {
          this._children.push(section);
        }
        return true
      }
      console.warn('A section cannot be the child of itself.');
      return false
    }


    /**
     * Checks if a given section is already one of the children of _this_ section
     * @param {Section} section - a section to test
     * @return {Boolean} true if the given section is already a child of _this_ section, false if not.
     */
    hasChild(section) {
      if (!this._children) return false

      const candidateId = section.getId();

      for (let i = 0; i < this._children.length; i += 1) {
        if (this._children[i].getId() === candidateId) return true
      }
      return false
    }


    /**
     * Get the size of _this_ section
     * @return {Number}
     */
    getSize() {
      let sum = 0;
      for (let i = 0; i < this._points.length - 1; i += 1) {
        const p1 = this._points[i];
        const p2 = this._points[i + 1];
        const dx = p1[0] - p2[0];
        const dy = p1[1] - p2[1];
        const dz = p1[2] - p2[2];
        sum += Math.sqrt(dx * dx + dy * dy + dz * dz);
      }

      return sum
    }


    /**
     * Get the morphology object that contains this section
     * @return {Morphology}
     */
    getMorphology() {
      return this._morphology
    }


    /**
     * Get all the children as an Array
     * @return {Array}
     */
    getChildren() {
      return this._children
    }
  }

  /*
  * Author   Jonathan Lurie - http://me.jonathanlurie.fr
  * License  Apache License 2.0
  * Lab      Blue Brain Project, EPFL
  */


  /**
   * The soma is the cell body of a neurone and thus is sort of a simplified version
   * of a Section, in term of datastructure.
   * A soma can be made of a single point (then it's just a center point) or of several,
   * then it's a more accurate description of a soma. When described with several points,
   * the representation is usually as a 2D polygon (even though it's in a 3D space)
   */
  class Soma {
    constructor() {
      this._id = null;
      this._typename = 'soma';
      this._typevalue = 1;
      this._points = [];
      this._radius = null;
    }

    /**
     * Defines the id of this soma.
     * Note: should probably not be used after `initWithRawSection` because then
     * sections already have ids and chance to messup the id game are pretty high.
     * @param {String|Number} id - the id
     */
    setId(id) {
      this._id = id;
    }


    /**
     * Get the id of _this_ soma
     * @return {String|Number}
     */
    getId() {
      return this._id
    }


    /**
     * Add a point to the soma description
     * @param {Number} x - the x coordinate of the point to add
     * @param {Number} y - the y coordinate of the point to add
     * @param {Number} z - the z coordinate of the point to add
     */
    addPoint(x, y, z) {
      this._points.push([x, y, z]);
    }


    /**
     * Get all the points of the soma
     * @return {Array} each element of the array if of form [x: Number, y: Number, z: Number]
     */
    getPoints() {
      return this._points
    }


    /**
     * Define the radius of the soma
     * @param {Number} r - the radius
     */
    setRadius(r) {
      this._radius = r;
    }


    /**
     * Get the radius of the soma.
     * @return {Number}
     */
    getRadius() {
      return this._radius
    }


    /**
     * Return the center of the soma.
     * If the soma is made of a single point and a radius, this method returns the
     * single point. If the soma is made of several points, this method returns the
     * average.
     * @return {Array|null} coordinate of the center as [x: Number, y: Number, z: Number]
     */
    getCenter() {
      const nbPoints = this._points.length;

      if (nbPoints === 1) {
        return this._points[0].slice()
      }

      if (nbPoints > 1) {
        const average = [0, 0, 0];
        for (let i = 0; i < nbPoints; i += 1) {
          average[0] += this._points[i][0];
          average[1] += this._points[i][1];
          average[2] += this._points[i][2];
        }
        average[0] /= nbPoints;
        average[1] /= nbPoints;
        average[2] /= nbPoints;
        return average
      }
      return null
    }


    /**
     * Build a soma using a raw soma object.
     * @param {Object} rawSoma - usually comes from a JSON file
     */
    initWithRawSection(rawSoma) {
      if (!rawSoma) {
        console.warn('Cannot init the Soma instance, no soma data provided in raw morphology.');
        return null
      }

      this._id = rawSoma.id;
      this._points = rawSoma.points.map(p => p.position);
      this._radius = rawSoma.radius;

      return this._id
    }
  }

  /*
  * Author   Jonathan Lurie - http://me.jonathanlurie.fr
  * License  Apache License 2.0
  * Lab      Blue Brain Project, EPFL
  */


  /**
   * A morphology is the data representation of a neurone's anatomy. It is composed
   * of one soma (cell body) and sections. Sections can be axons, dendrites, etc.
   * A Morphology instance can be built from scratch (though it can be a bit tedious)
   * but will generally be built using a JSON description.
   */
  class Morphology {
    constructor() {
      this._id = null;
      this._sections = {};
      this._soma = null;

      // these are catgories of sections that we may need. Look at `getOrphanSections`
      // and `_findSpecialSection`
      this._specialSections = {};
    }


    /**
     * Set the ID of _this_ morphology
     * @param {String|Number} id - the id
     */
    setId(id) {
      this._id = id;
    }


    /**
     * Get the ID of _this_ morphology
     * @return {String|Number}
     */
    getId() {
      return this._id
    }


    /**
     * Build a morphology from a raw dataset, that usually comes from a JSON file.
     * Note that some files do not provide any data about the soma. In this case, the Soma
     * instance remains `null`
     * @param {Object} rawMorphology - a flat tree description of a morphology
     */
    buildFromRawMorphology(rawMorphology) {
      // Sometimes, we have no data about the soma
      if (rawMorphology.soma) {
        this._soma = new Soma();
        this._soma.initWithRawSection(rawMorphology.soma);
      }

      // Build the Section instances.
      // This first step does not define parents nor children
      for (let i = 0; i < rawMorphology.sections.length; i += 1) {
        const s = new Section(this);
        const sId = s.initWithRawSection(rawMorphology.sections[i]);
        this._sections[sId] = s;
      }

      // Now we define parent and children
      for (let i = 0; i < rawMorphology.sections.length; i += 1) {
        const currentRawSection = rawMorphology.sections[i];
        const currentSection = this._sections[currentRawSection.id];

        // adding a parent if there is one
        // can be 0 but cannot be null (in JS, 0 and null are diff)
        if (currentRawSection.parent !== null) {
          const parent = this._sections[currentRawSection.parent];
          currentSection.setParent(parent);
        }

        const children = currentRawSection.children.map(c => this._sections[c]);
        for (let c = 0; c < children.length; c += 1) {
          currentSection.addChild(children[c]);
        }
      }
    }


    /**
     * Retrieve the total number of section in this morphology
     * @return {Number}
     */
    getNumberOfSections() {
      return Object.keys(this._sections)
    }


    /**
     * Get a section, given its id
     * @param {String|Number} id - the id of a section
     * @return {Section|null} the requested section or null if the id is invalid
     */
    getSection(id) {
      if (id in this._sections) {
        return this._sections[id]
      }
      return null
    }


    /**
     * Get all the sections of _this_ morphology as an array, because sometimes it's
     * more convenient for iterating.
     * @return {Array} array of Section instances
     */
    getArrayOfSections() {
      return Object.values(this._sections)
    }


    /**
     * Get the soma Object
     * @return {Soma}
     */
    getSoma() {
      return this._soma
    }


    /**
     * Get all the section with no parent (_parent = null)
     * Those are directly tied to the soma
     * @param {Boolean} force - if true, the fetching among the sections will be done again
     * @return {Array} array of Sections
     */
    getOrphanSections(force = false) {
      const speciality = 'orphans';

      // extract, if not done before
      this._findSpecialSection(
        'orphans',
        s => !s.getParent(),
        force,
      );

      return this._specialSections[speciality]
    }


    /**
     * @private
     * Helper function to build a subset of Sections based on the selections perfomed by `selector`
     * @param {String} specialityName - name of the spaciality
     * @param {Function} selector - function that takes a Section and returns a boolean.
     * if true is return, a section will be selected
     * @param {Boolean} force - if true: rebuild the list, if false:
     * just return the list previously build
     */
    _findSpecialSection(specialityName, selector, force = false) {
      if (!(specialityName in this._specialSections)) {
        this._specialSections[specialityName] = null;
      }

      if (force || !this._specialSections[specialityName]) {
        this._specialSections[specialityName] = [];
        const allSections = Object.values(this._sections);
        for (let i = 0; i < allSections.length; i += 1) {
          if (selector(allSections[i])) {
            this._specialSections[specialityName].push(allSections[i]);
          }
        }
      }
      return this._specialSections[specialityName]
    }
  }

  var index = ({
    Morphology,
  });
  //# sourceMappingURL=morphologycorejs.js.map

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

      this._morphology = new index.Morphology();
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

  var index$1 = ({
    SwcParser,
  });

  return index$1;

})));
//# sourceMappingURL=swcmorphologyparser.js.map
