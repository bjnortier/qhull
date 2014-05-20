
var Viewport = require('./viewport');
var Trackball = require('./trackball');
var Vector = require('../../../lib/vector');
var qhull = require('../../../lib/qhull');

var setupContainer = document.createElement('div');
setupContainer.classList.add('viewport');
document.body.appendChild(setupContainer);
var setupViewport = new Viewport(setupContainer);
new Trackball(setupViewport);

// var points = [
//   new Vector(0,0,0),
//   new Vector(10,0,0),
//   new Vector(10,20,0),
//   new Vector(0,20,0),
//   new Vector(0,0,30),
//   new Vector(10,0,30),
//   new Vector(10,20,30),
//   new Vector(0,20,30),
// ];

var points = [];
for (var i = 0; i < 1000; ++i) {
  points.push(new Vector(Math.random()*20-10, Math.random()*20-10, Math.random()*20-10));
}

setupViewport.addPoints(points, 0.5, 0x009900);

var setup = qhull.setup(points);
console.log(setup);
var mesh = setup.tetrahedron;

setupViewport.addMesh(setup.tetrahedron, 0x0000ff);
var remaining = mesh.faces.reduce(function(acc, face) {
  if (face.points) {
    acc = acc.concat(face.points);
  }
  return acc;
}, []);

setupViewport.addPoints(remaining, 0.5, 0x009900);

qhull.assignPointsToFaces(points, mesh);

function addHullViewport() {
  var hullContainer = document.createElement('div');
  hullContainer.classList.add('viewport');
  document.body.appendChild(hullContainer);
  var hullViewport = new Viewport(hullContainer);
  new Trackball(hullViewport);
  return hullViewport;
}

var popped;
var debug = false;
var i = 0;
do {
  var hullViewport;
  if (i > 200) {
    console.log(i);
  }

  popped = qhull.popNext(mesh);
  // Final result
  if (!popped) {
    hullViewport = addHullViewport();
    hullViewport.addMesh(mesh, 0x009900);
    hullViewport.addPoints(points, 0.5, 0x000099);
  } else if (debug) {
    hullViewport = addHullViewport();
    hullViewport.addMesh(mesh, 0x0000ff);

    var remaining = mesh.faces.reduce(function(acc, face) {
      if (face.points) {
        acc = acc.concat(face.points);
      }
      return acc;
    }, []);
    hullViewport.addPoints(remaining, 0.5, 0x009900);
    hullViewport.addPoints([popped], 0.5, 0x990000);
  }
  ++i;
} while (popped && i < 1000);