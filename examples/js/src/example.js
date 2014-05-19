
var Viewport = require('./viewport');
var Trackball = require('./trackball');
var Vector = require('../../../lib/vector');
var qhull = require('../../../lib/qhull');

var setupContainer = document.createElement('div');
setupContainer.classList.add('viewport');
document.body.appendChild(setupContainer);
var setupViewport = new Viewport(setupContainer);
new Trackball(setupViewport);

var points = [
  new Vector(0,0,0),
  new Vector(10,0,0),
  new Vector(10,20,0),
  new Vector(0,20,0),
  new Vector(0,0,30),
  new Vector(10,0,30),
  new Vector(10,20,30),
  new Vector(0,20,30),
];

points = [];
for (var i = 0; i < 20; ++i) {
  points.push(new Vector(Math.random()*20, Math.random()*20, Math.random()*20));
}

setupViewport.addPoints(points, 0.2, 0x00ff00);

var setup = qhull.setup(points);
console.log(setup);

setupViewport.addPoints(setup.base, 0.5, 0x0000ff);
setupViewport.addPoints([setup.apex.point], 0.5, 0xff0000);
setupViewport.addMesh(setup.tetrahedron, 0x0000ff);

var mesh = setup.tetrahedron;
qhull.assignPointsToFaces(points, mesh);

var popped;
do {

  popped = qhull.popNext(mesh);
  if (popped) {
    var hullContainer = document.createElement('div');
    hullContainer.classList.add('viewport');
    document.body.appendChild(hullContainer);
    var hullViewport = new Viewport(hullContainer);
    new Trackball(hullViewport);
    hullViewport.addMesh(mesh, 0x0000ff);

    var remaining = mesh.faces.reduce(function(acc, face) {
      if (face.points) {
        acc = acc.concat(face.points);
      }
      return acc;
    }, []);

    hullViewport.addPoints(remaining, 0.2, 0x00ff00);
    hullViewport.addPoints([popped], 0.5, 0xff0000);
  }

} while (popped);