
var Viewport = require('./viewport');
var Trackball = require('./trackball');
var Vector = require('../../../lib/vector');
var qhull = require('../../../lib/qhull');

var beforeViewport = new Viewport($('div.before')[0]);
var afterViewport = new Viewport($('div.after')[0]);
new Trackball([beforeViewport, afterViewport]);

var mesh, points;

function randomize() {
  beforeViewport.clear();
  afterViewport.clear();

  var N = parseInt($('#n_points').val() || 10);
  points = [];
  for (var i = 0; i < N; ++i) {
    points.push(new Vector(Math.random()*20-10, Math.random()*20-10, Math.random()*20-10));
  }
  beforeViewport.addPoints(points, 0.5, 0x009900);
  mesh = qhull.init(points);
  afterViewport.addMesh(mesh, 0x0000ff);
  afterViewport.addPoints(points, 0.5, 0x009900);
}

function filterMesh(mesh, fn) {
  return {
    vertices: mesh.vertices,
    faces: mesh.faces.reduce(function(acc, f, i) {
      if (fn(f,i)) {
        acc.push(f);
      }
      return acc;
    }, []),
  };
}

function showFinalResult() {
  beforeViewport.clear();
  afterViewport.clear();
  beforeViewport.addPoints(points, 0.5, 0x009900);
  beforeViewport.addMesh(mesh, 0x0000ff);
}

function step() {
  var result = qhull.iterate(mesh);
  if (result) {
    beforeViewport.clear();
    afterViewport.clear();

    var mesh0 = result.mesh0;
    var oldMeshWithoutLightFaces = filterMesh(
      mesh0,
      function(f, i) {
        return result.lightFaces.indexOf(i) === -1;
      });

    var lightFaceMesh = filterMesh(
      mesh0,
      function(f, i) {
        return result.lightFaces.indexOf(i) !== -1;
      });

    beforeViewport.addMesh(oldMeshWithoutLightFaces, 0x0000ff);
    beforeViewport.addMesh(lightFaceMesh, 0xffff00);
    beforeViewport.addPoints([result.point], 1.0, 0xff0000);
    beforeViewport.addPoints(points, 0.5, 0x009900);

    var newMeshWithOldFaces = filterMesh(
      mesh,
      function(f, i) {
        return result.newFaces.indexOf(i) === -1;
      });
    var newMeshWithNewFaces = filterMesh(
      mesh,
      function(f, i) {
        return result.newFaces.indexOf(i) !== -1;
      });

    afterViewport.addPoints([result.point], 0.5, 0xff0000);
    afterViewport.addPoints(points, 0.5, 0x009900);
    afterViewport.addMesh(newMeshWithOldFaces, 0x0000ff);
    afterViewport.addMesh(newMeshWithNewFaces, 0x00cccc);
  } else {
    showFinalResult();
  }
  return result;
}

function proceed() {
  var result = step();
  if (result) {
    setTimeout(proceed, 0);
  }
}

$('#randomize').click(function() {
  randomize();
});

$('#generate').click(function() {
  proceed();
});

$('#randomize_generate').click(function() {
  randomize();
  proceed();
});

$('#step').click(function() {
  step();
});

randomize();
