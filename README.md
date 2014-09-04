[![Build Status](https://travis-ci.org/bjnortier/qhull.png?branch=master)](https://travis-ci.org/bjnortier/qhull)

# qhull

A *Non-robust* Javascript 3D Quickhull Implementation

The best description of the Quickhull algorithm I found is here:
http://thomasdiewald.com/blog/?p=1888

and the paper describing the algorithm in detail can be found here:
http://www.cise.ufl.edu/~ungor/courses/fall06/papers/QuickHull.pdf

## Building

To run in a browser (and for the demo), this library uses browserify. When files have updated, the build results need to be updated. This can be done by running

    $ grunt browserify

in the console. Alternatively, keep a grunt watch process running during development which will automatically update the build if the source files change:

    $ grunt watch

## Usage

To use in nodejs, npm install and use require as usual:

    require('qhull');

For the browser, and when not using browserify, you can use the self-contained library build in build/qhull.js:

    <script src="qhull.js"></script>
    <script>
      var mesh = QHull.generate([... points ...]);
    </script>

## Demo

Clone the repo and open demo/index.html to see a steppable demo of the algorithm which uses Three.js for visualisation.

## License

MIT
