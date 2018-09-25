# SWC moprhology parser

An instance of SwcParser is made to parse SWC files with [the given specification](http://www.neuronland.org/NLMorphologyConverter/MorphologyFormats/SWC/Spec.html).  
The data output by this parser is a Javascript object representing a the tree structure of the morphology. Each node of the tree is a section that contain a reference to its parent section and references to its children sections. The tree is given flat, meaning all the sections are at the same hierarchy level within the JS object and every section is identified by an arbitrary ID.

## Example
```JavaScript
let swcParser = new swcmorphologyparser.SwcParser()
swcParser.parse(data)
let rawMorpho = swcParser.getRawMorphology()

// if rawMorpho is null, then it mean the file was not a propper SWC
```

Where `data` is the sting content of a SWC file.

- [DEMO TEXT](http://me.jonathanlurie.fr/swcmorphologyparser/examples/browser.html) - Output a JSON of the morphology tree
- [DEMO 3D](http://me.jonathanlurie.fr/swcmorphologyparser/examples/viewer.html) - Output a 3D morphology
