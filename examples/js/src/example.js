
var Viewport = require('./viewport');
var Trackball = require('./trackball');
var Vector = require('../../../lib/vector');
var qhull = require('../../../lib/qhull');

var setupContainer = document.createElement('div');
setupContainer.classList.add('viewport');
document.body.appendChild(setupContainer);
var setupViewport = new Viewport(setupContainer);
new Trackball(setupViewport);

var cube = [
  new Vector(0,0,0),
  new Vector(10,0,0),
  new Vector(10,20,0),
  new Vector(0,20,0),
  new Vector(0,0,30),
  new Vector(10,0,30),
  new Vector(10,20,30),
  new Vector(0,20,30),
];

setupViewport.addPoints(cube, 0.5, 0x00ff00);

var setup = qhull.setup(cube);
console.log(setup);

setupViewport.addPoints(setup.base, 1.0, 0x0000ff);
setupViewport.addPoints([setup.apex.point], 1.0, 0xff0000);
setupViewport.addMesh(setup.tetrahedron, 0x0000ff);

var mesh = setup.tetrahedron;
qhull.assignPointsToFaces(cube, mesh);

var popped, i = 0;
do {
  popped = qhull.popNext(mesh);
  console.log(popped);
  if (popped) {
    var hullContainer = document.createElement('div');
    hullContainer.classList.add('viewport');
    document.body.appendChild(hullContainer);
    var hullViewport = new Viewport(hullContainer);
    new Trackball(hullViewport);
    hullViewport.addMesh(mesh, 0x0000ff);
    hullViewport.addPoints([popped], 0.5, 0xff0000);
  }

  ++i;
} while (popped && i < 5);