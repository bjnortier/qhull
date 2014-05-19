
var Viewport = require('./viewport');
var Trackball = require('./trackball');
var Vector = require('../../../lib/vector');
var qhull = require('../../../lib/qhull');

var container = document.createElement('div');
container.classList.add('viewport');
document.body.appendChild(container);
var viewport = new Viewport(container);
new Trackball(viewport);

var cube = [
  new Vector(5,0,0),
  new Vector(10,0,0),
  new Vector(10,20,0),
  new Vector(0,20,0),
  new Vector(0,0,30),
  new Vector(10,0,30),
  new Vector(10,20,30),
  new Vector(0,20,30),
];

viewport.addPoints(cube, 0.5, 0x00ff00);

var setup = qhull.setup(cube);
viewport.addPoints(setup.base, 1.0, 0x0000ff);
viewport.addPoints([setup.apex.point], 1.0, 0xff0000);
console.log(setup);

var tetrahedron = [
  setup.base,
  [setup.base[0], setup.apex.point, setup.base[1]],
  [setup.apex.point, setup.base[2], setup.base[1]],
  [setup.base[0], setup.base[2], setup.apex.point],
];
viewport.addTriangles(tetrahedron, 0x0000ff);
