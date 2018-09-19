# What is es6module ?
It's a simple module architecture using [Rollup](http://rollupjs.org) to bundle the code in one single source file. The purpose is to use your module in a browser with a single import.  

This module contains a [ES6 classes](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Classes) example: `Foo`. This class is then imported by the project entry-point: `src/main.js`, using the ES6 import style.

Code documentation can also be generated thanks to [Documentation.js](http://documentation.js.org/) that uses the [JSDoc](http://usejsdoc.org/) syntax.

## Using es6module as a base
**es6module** is not made to be used as-is, but rather to be a starting-point/boilerplate to make your own module. Here is the list of things to change to make it yours:

The entry-point of the module is `src/main.js`, of course, you should rename this file with the name of your choice.

In `package.json` file, you can edit:
- `name`, should be the one of your choice (lower case, possibly with dashes)
- `version` better to manage it with `npm version XXX`
- `description` with the description of what your project does
- `main` just update the name of the generated bundle, but keep the one produced in `dist/`
- `min` the minified version of the `main` source, also in `dist/`
- `author` your name
- `license` you can keep MIT of take another one


## Adding custom classes
As you can see in `src/main.js`, we import the file `Foo.js`. **Foo** uses the ES6 class notation but alternatively, your custom classes can use the *prototype* kind of declaration. What matters is to export your class or function, like in the very last line of `Foo.js`.

# Dev mode
Rollup provides a *watch* mode that can be coupled with *serve*. To launch it:
```bash
$ npm run dev
```

This actually calls `rollup -c` with the config file `rollup.config.dev.js`.

# Build your module
An ES6 module can be composed of as many source files as you wish, but in the end, they will all be smartly concatenated into a single *js* bundle.

The purpose of building is to have a single *js* source file used in external projects, that contains all the modules. The default is to put it in the `/dist/` directory.
Two alternative ways are possible here, they produce the same result:

1. Using Rollup from the script:  
```bash
$ npm run build
```
This actually calls `rollup -c`, that reads its necessary setting from `rollup.config.js`.

There difference between `npm run build` and `npm run dev` are:
- `build` transpiles the source into ES5 for better compatibility
- `build` creates 2 files: the regular ES5 bundle and the minified bundle
- `dev` watches and launches a local server
- `dev` updates the codemap for easier debugging

# How to use my module?
The advantage of the *umd* package specification is that it's compatible everywhere: Node, Browser and ES6 import.

From HTML:
```html
<script src="../dist/es6module.js"></script>
<!-- Or with the minified bundle -->
<script src="../dist/es6module.min.js"></script>
```

From Node:
```js
const es6module = require("es6module");
```

From ES6:
```js
import es6module from 'es6module';
```

Then, no matter your setup, you can use *es6module* the same way:
```js
var foo = new es6module.Foo(20, 30);

// do something with foo
foo.printAnAttribute();
foo.setAnAttribute(34)
foo.printAnAttribute();
```

# Documentation
Even if you code only for yourself, a bit of documentation can not hurt :) .  
Use the [JSDoc](http://usejsdoc.org/) syntax and then run:  
```bash
$ npm run doc
```
Two kinds of documentations will be generated: a HTML kind in `doc/` and a markdown kind in `./documentation.md`.

# Extra
Since I clone this repo a lot and use it as a start for almost every new project, I decided to create a script to:
- clone (with depth=1)
- remove the `.git` folder
- remove files and folder that are going to be replaced anyway (doc, dist bundles)
- replace the every "es6module" by "mynewfancymodule"
- removes readme's content
- run `npm install`

```bash
function es6module(){
  git clone --depth=1 --branch=master https://github.com/jonathanlurie/es6module.git  $1
  cd $1
  rm -rf .git
  rm -rf dist/* documentation.md doc/* package-lock.json
  find . -type f -iname '*' -exec sed -i '' "s/es6module/$1/g" "{}" +;
  printf "# $1\n[here goes the readme]\n" > readme.md
  npm install
}
```

Copy the script to the `.bashrc` and to run it:
```bash
es6module mynewfancymodule
```
