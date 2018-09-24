# SWC moprhology parser

Parses SWC neuron morphology files in JavaScript.

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
