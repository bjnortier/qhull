(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

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

},{"../../../lib/qhull":5,"../../../lib/vector":6,"./trackball":2,"./viewport":3}],2:[function(require,module,exports){

function eventToPosition(event) {
  return {
    x: event.offsetX,
    y: event.offsetY,
  };
}

module.exports = function(viewports) {

  var minDistance = 3;
  var maxDistance = 10000;
  var position = { azimuth: Math.PI/4, elevation: Math.PI*3/8, distance: 20 };
  var target = { azimuth: Math.PI/4, elevation: Math.PI*3/8, distance: 20, scenePosition: new THREE.Vector3()};
  var lastMousePosition, mouseDownPosition, targetOnDown, state;
  var damping = 0.25;
  var that = this;

  this.mousedown = function(event) {
    mouseDownPosition = eventToPosition(event);
    targetOnDown = {
      azimuth:  target.azimuth,
      elevation: target.elevation,
    };
  };

  this.mouseup = function() {
    state = undefined;
    mouseDownPosition = undefined;
  };

  this.mousemove = function(event) {
    if (mouseDownPosition && lastMousePosition) {
      var eventPosition = eventToPosition(event);
      var dMouseFromDown = {
        x: eventPosition.x - mouseDownPosition.x,
        y: eventPosition.y - mouseDownPosition.y,
      };

      if (state === undefined) {
        state = 'rotating';
      }

      if (state === 'rotating') {
        var zoomDamp = 0.001 * Math.sqrt(position.distance);
        target.azimuth = targetOnDown.azimuth - dMouseFromDown.x * zoomDamp;
        target.elevation = targetOnDown.elevation - dMouseFromDown.y * zoomDamp;
        target.elevation = target.elevation > Math.PI ? Math.PI : target.elevation;
        target.elevation = target.elevation < 0 ? 0 : target.elevation;
        that.updateCamera();
      }

    }
    lastMousePosition = eventToPosition(event);
  };

  this.mousewheel = function(event) {
    var factor = 0.005;
    event.preventDefault();
    event.stopPropagation();
    if (event.wheelDelta) {
      target.distance -= event.wheelDelta * Math.sqrt(position.distance)*factor;
    }
    // For Firefox
    if (event.detail) {
      target.distance -= -event.detail*60 * Math.sqrt(position.distance)*factor;
    }
  };

  function animate() {
    requestAnimationFrame(animate);
    that.updateCamera();
  }

  this.updateCamera = function() {
    position.azimuth += (target.azimuth - position.azimuth) * damping;
    position.elevation += (target.elevation - position.elevation) * damping;

    var dDistance = (target.distance - position.distance) * damping;
    var newDistance = position.distance + dDistance;
    if (newDistance > maxDistance) {
      target.distance = maxDistance;
      position.distance = maxDistance;
    } else if (newDistance < minDistance) {
      target.distance = minDistance;
      position.distance = minDistance;
    } else {
      position.distance = newDistance;
    }

    viewports.forEach(function(viewport) {
      viewport.camera.position.x = position.distance * Math.sin(position.elevation) * Math.cos(position.azimuth);
      viewport.camera.position.y = position.distance * Math.sin(position.elevation) * Math.sin(position.azimuth);
      viewport.camera.position.z = position.distance * Math.cos(position.elevation);
      viewport.camera.up = new THREE.Vector3(0,0,1);
      viewport.camera.lookAt(new THREE.Vector3(0,0,0));
    });

  };

  viewports.forEach(function(viewport) {
    viewport.container.addEventListener('mousemove', that.mousemove, false);
    viewport.container.addEventListener('mousedown', that.mousedown, false);
    viewport.container.addEventListener('mouseup', that.mouseup, false);
    viewport.container.addEventListener('mouseout', that.mouseup, false);
    viewport.container.addEventListener('mousewheel', that.mousewheel, false);
  });

  animate();

};



},{}],3:[function(require,module,exports){

module.exports = function(container) {

  var camera, renderer, light;
  var that = this;
  that.container = container;

  function onWindowResize() {
    var containerWidth = $(container).width();
    container.style.height = containerWidth + 'px';
    camera.aspect = 1.0;
    camera.updateProjectionMatrix();
    renderer.setSize(containerWidth-1, containerWidth-1);
    return containerWidth;
  }

  function init() {

    camera = new THREE.PerspectiveCamera(70, 1.0, 0.1, 10000 );
    that.camera = camera;
    camera.position.z = 40;
    camera.position.x = 40;
    camera.position.y = 40;
    camera.up = new THREE.Vector3(0,0,1);
    camera.lookAt(new THREE.Vector3(0,0,0));

    that.scene = new THREE.Scene();
    that.scene.add( new THREE.AmbientLight(0x101010) );

    light = new THREE.PointLight( 0xffffff, 1.5 );
    light.position.set(0, 0, 2000);
    that.scene.add( light );

    var xMaterial = new THREE.LineBasicMaterial({color: 0x00ff00, opacity: 0.5});
    var yMaterial = new THREE.LineBasicMaterial({color: 0x0000ff, opacity: 0.5});
    var zMaterial = new THREE.LineBasicMaterial({color: 0xff0000, opacity: 0.5});

    var xGeom = new THREE.Geometry();
    xGeom.vertices.push(new THREE.Vector3(0, 0, 0));
    xGeom.vertices.push(new THREE.Vector3(1000, 0, 0));
    var yGeom = new THREE.Geometry();
    yGeom.vertices.push(new THREE.Vector3(0,0, 0));
    yGeom.vertices.push(new THREE.Vector3(0, 1000, 0));
    var zGeom = new THREE.Geometry();
    zGeom.vertices.push(new THREE.Vector3(0, 0, 0));
    zGeom.vertices.push(new THREE.Vector3(0, 0, 1000));

    that.scene.add(new THREE.Line(xGeom, xMaterial));
    that.scene.add(new THREE.Line(yGeom, yMaterial));
    that.scene.add(new THREE.Line(zGeom, zMaterial));
    that.exampleObj = new THREE.Object3D();
    that.scene.add(that.exampleObj);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.sortObjects = false;
    renderer.setClearColor(0xffffff, 1);
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();
  }



  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  function render() {
    light.position = camera.position;
    renderer.render(that.scene, camera);
  }

  this.clear = function() {

    var clearObj = function(obj) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        obj.material.dispose();
      }
      if (obj.children) {
        obj.children.map(clearObj);
      }
    };
    clearObj(this.exampleObj);

    this.scene.remove(this.exampleObj);
    this.exampleObj = new THREE.Object3D();
    this.scene.add(this.exampleObj);
    render();
  };

  this.addPoints = function(points, size, color) {

    var particles = new THREE.Geometry();
    particles.vertices = points.map(function(point) {
      return new THREE.Vector3(point.x, point.y, point.z);
    });

    var pMaterial = new THREE.ParticleBasicMaterial({
      color: color,
      size: size,
    });
    var particleSystem = new THREE.ParticleSystem(
      particles,
      pMaterial);
    that.exampleObj.add(particleSystem);
  };

  this.addMesh = function(mesh, color) {

    var geometry = new THREE.Geometry();
    geometry.vertices = mesh.vertices.map(function(v) {
      return new THREE.Vector3(v.x, v.y, v.z);
    });
    geometry.faces = mesh.faces.map(function(f) {
      return new THREE.Face3(f.a, f.b, f.c);
    });
    geometry.computeFaceNormals();
    this.exampleObj.add(
      THREE.SceneUtils.createMultiMaterialObject(geometry, [
        new THREE.MeshLambertMaterial({color: color, transparent: true, opacity: 0.5}),
        new THREE.MeshBasicMaterial({color: color, wireframe: true, linewidth: 5}),
      ]));
  };

  this.clear = function() {
    this.scene.remove(this.exampleObj);
    this.exampleObj = new THREE.Object3D();
    this.scene.add(this.exampleObj);
  };

  init();
  animate();


};
},{}],4:[function(require,module,exports){
"use strict";

// Construct a plane from 3 points
function Plane(a,b,c) {
  this.a = a;
  this.n = b.subtract(a).cross(c.subtract(a)).normalize();
  this.w = this.n.dot(a);
}

// http://mathworld.wolfram.com/Point-PlaneDistance.html
Plane.prototype.pointDistance = function(p) {
  return this.n.dot(p.subtract(this.a));
};

module.exports = Plane;
},{}],5:[function(require,module,exports){
"use strict";

// 3D Convex hull of a set of points
// Described here:
// http://thomasdiewald.com/blog/?p=1888
//
// Some inspiraton from https://github.com/marklundin/quickhull

var Vector = require('./vector');
var Plane = require('./plane');

module.exports.Vector = Vector;

// Distance from the plane considered on the plane
var EPS = 1e-6;

// Find the 6 extreme points
function findExtremePoints(points) {
  var extremes = [];
  for (var i = 0; i < points.length; ++i) {
    if (!extremes[0] || (points[i].x < extremes[0].x)) {
      extremes[0] = points[i];
    }
    if (!extremes[1] || (points[i].x > extremes[1].x)) {
      extremes[1] = points[i];
    }
    if (!extremes[2] || (points[i].y < extremes[2].y)) {
      extremes[2] = points[i];
    }
    if (!extremes[3] || (points[i].y > extremes[3].y)) {
      extremes[3] = points[i];
    }
    if (!extremes[4] || (points[i].z < extremes[4].z)) {
      extremes[4] = points[i];
    }
    if (!extremes[5] || (points[i].z > extremes[5].z)) {
      extremes[5] = points[i];
    }
  }
  return extremes;
}

// Find the two EPs that are most distant from each other
function findMostDistantExpremePointIndices(extremePoints) {
  var maxDistance = -Infinity;
  var from, to;
  for (var fromIndex = 0; fromIndex < extremePoints.length - 1; ++fromIndex) {
    for (var toIndex = fromIndex + 1; toIndex < extremePoints.length; ++toIndex) {
      var distance = extremePoints[fromIndex].subtract(extremePoints[toIndex]).length();
      if (distance > maxDistance) {
        maxDistance = distance;
        from  = fromIndex;
        to = toIndex;
      }
    }
  }
  return [from, to];
}

// Find the point most distance from the line
function findMostDistantToLine(points, a, b) {
  var maxDistance = -Infinity;
  var mostDistant;
  for (var i = 0; i < points.length; ++i) {
    var d = points[i].distanceToLine(a,b);
    if (d > maxDistance) {
      maxDistance = d;
      mostDistant = points[i];
    }
  }
  return mostDistant;
}

// Find the initial tetrahedron apex as the point furthest
// from the base plane
function findMostDistantFromPlane(basePlane, points) {
  var maxDistance = 0;
  var point;
  var index;
  for (var i = 0; i < points.length; ++i) {
    var distance = basePlane.pointDistance(points[i]);
    if (Math.abs(distance) > Math.abs(maxDistance)) {
      maxDistance = distance;
      point = points[i];
      index = i;
    }
  }
  return {
    point: point,
    distance: maxDistance,
    index: index,
  };
}


// Assign points to faces, by assigning point to first face it is in front of
// Return an array of the same size as the mesh faces array, with the points
// for that face
function assignPointsToFaces(points, mesh) {
  var faces = mesh.faces.slice(0);
  var vertices = mesh.vertices.slice(0);

  for (var i = 0; i < points.length; ++i) {
    var point = points[i];
    for (var k = 0; k < faces.length; ++k) {
      var face = faces[k];
      var plane = new Plane(vertices[face.a], vertices[face.b], vertices[face.c]);
      if (plane.pointDistance(point) > EPS) {
        if (!faces[k].hasOwnProperty('points')) {
          faces[k].points = [];
        }
        faces[k].points.push(point);
        break;
      }
    }
  }
}

module.exports.assignPointsToFaces = assignPointsToFaces;

function findAdjacentFaceIndices(mesh, faceIndices) {
  var sharedVertices = faceIndices.reduce(function(acc, i) {
    var f = mesh.faces[i];
    if (acc.indexOf(f.a) === -1) {
      acc.push(f.a);
    }
    if (acc.indexOf(f.b) === -1) {
      acc.push(f.b);
    }
    if (acc.indexOf(f.c) === -1) {
      acc.push(f.c);
    }
    return acc;
  }, []);
  var faceSet = [];
  for (var i = 0; i < mesh.faces.length; ++i) {
    var face = mesh.faces[i];
    if ((sharedVertices.indexOf(face.a) !== -1) ||
        (sharedVertices.indexOf(face.b) !== -1) ||
        (sharedVertices.indexOf(face.c) !== -1)) {
      faceSet.push(i);
    }
  }
  return faceSet;
}

// Find faces that can be seen from the point (i.e. positive distance from the face plane)
function findLightFaces(point, mesh, lightFaces) {
  var adjacentFaceIndices = findAdjacentFaceIndices(mesh, lightFaces);
  var added;
  do {
    for (var i = 0; i < adjacentFaceIndices.length; ++i) {
      var adjacentFaceIndex = adjacentFaceIndices[i];
      var face = mesh.faces[adjacentFaceIndex];
      var plane = new Plane(mesh.vertices[face.a], mesh.vertices[face.b], mesh.vertices[face.c]);
      if ((plane.pointDistance(point) > EPS) && (lightFaces.indexOf(adjacentFaceIndex) === -1)) {
        lightFaces.push(adjacentFaceIndex);
        added = true;
      }
    }
    added = false;
  } while (added);
  return lightFaces;
}

function addEdgeToCount(a,b,count) {
  var key = Math.min(a,b) + '_' + Math.max(a,b);
  if (!count[key]) {
    count[key] = {
      n: 1,
      originalOrder: [a,b],
    };
  } else {
    ++count[key].n;
  }
}

// Find the horizon edges, which are edges that only bound a single light face
function findHorizonEdges(mesh, lightFaceIndices) {
  var edgeCounts = {};
  for (var i = 0; i < lightFaceIndices.length; ++i) {
    var face = mesh.faces[lightFaceIndices[i]];
    addEdgeToCount(face.a, face.b, edgeCounts);
    addEdgeToCount(face.b, face.c, edgeCounts);
    addEdgeToCount(face.c, face.a, edgeCounts);
  }
  var horizonEdges = [];

  // The original normal ordering is maintained in the e3dge count and used to construct
  // horizon
  for (var key in edgeCounts) {
    if (edgeCounts[key].n === 1) {
      horizonEdges.push(edgeCounts[key].originalOrder);
    }
  }
  return horizonEdges;
}


// Initialise the hull algorithm with a set 
// of point. It will create an initial tetrahedron and assign the points
// to the faces of the tetrahedron
module.exports.init = function(points) {

  var extremePoints = findExtremePoints(points);
  var mostDistantExtremePointIndices = findMostDistantExpremePointIndices(extremePoints);

  // The remaining points with the most distant ones removed
  // Sort so that the lower index remains consistent
  mostDistantExtremePointIndices.sort();
  var remaining = extremePoints.slice(0);
  remaining.splice(mostDistantExtremePointIndices[1], 1);
  remaining.splice(mostDistantExtremePointIndices[0], 1);

  var a = extremePoints[mostDistantExtremePointIndices[0]];
  var b = extremePoints[mostDistantExtremePointIndices[1]];
  var c = findMostDistantToLine(remaining, a, b);

  // Correct normal for positive apex distance
  var basePlane = new Plane(a,c,b);
  var apex = findMostDistantFromPlane(basePlane, points);

  // Correct normal so that right-hand base normal points away from apex
  var base = apex.distance > 0 ? [a,b,c] : [a,c,b];
  var mesh = {
    vertices: base.concat(apex.point),
    faces: [{a:0, b:1, c:2}, {a:0, b:3, c:1}, {a:3, b:2, c:1}, {a:0, b:2, c:3}]
  };

  assignPointsToFaces(points, mesh);
  return mesh;

};

// Iterate the algorithm by findind the next face with points
// and adding new faces from the horizon to the most distant point
//
// returns the selected point and light face indices for debugging
// or `undefined` if there are no more points.
module.exports.iterate = function(mesh) {
  // capture the mesh before iteration
  var mesh0 = {
    vertices: mesh.vertices.slice(0),
    faces: mesh.faces.slice(0),
  };

  // Find the next face in the mesh with points
  for (var i = 0; i < mesh.faces.length; ++i) {
    var face = mesh.faces[i];
    var points = face.points;
    if (points && points.length) {
      var plane = new Plane(mesh.vertices[face.a], mesh.vertices[face.b], mesh.vertices[face.c]);
      var mostDistant = findMostDistantFromPlane(plane, points);
      var lightFaces = findLightFaces(mostDistant.point, mesh, [i]);
      var horizonEdges = findHorizonEdges(mesh, lightFaces);

      // Create new faces using the point and the horinzon edges
      var newVertexIndex = mesh.vertices.push(mostDistant.point) - 1;
      var newFaces = horizonEdges.map(function(edge) {
        var index = mesh.faces.push({a: edge[0], b: edge[1], c: newVertexIndex}) - 1;
        return index;
      });

      // Reclassify all the point of the light faces. Current face's points
      // and all the light faces (wihout the current face)
      var remaining = points;
      remaining.splice(mostDistant.index, 1);
      lightFaces.forEach(function(faceIndex) {
        if (faceIndex !== i) {
          var face = mesh.faces[faceIndex];
          if (face.points) {
            remaining = remaining.concat(face.points);
          }
        }
      });

      // Remove the light faces from the mesh and update the indices
      // of the new faces
      var prunedFaces = [];
      for (var k = 0; k < mesh.faces.length; ++k) {
        if (lightFaces.indexOf(k) === -1) {
          prunedFaces.push(mesh.faces[k]);
        } else {
          newFaces = newFaces.map(function(index) {
            return index >= k ? index-1 : index;
          });
        }
      }
      mesh.faces = prunedFaces;

      assignPointsToFaces(remaining, mesh);
      return {
        point: mostDistant.point,
        lightFaces: lightFaces,
        newFaces: newFaces,
        mesh0: mesh0,
      };
    }
  }
  return undefined;
};
},{"./plane":4,"./vector":6}],6:[function(require,module,exports){
"use strict";

// # class Vector

// Represents a 3D vector.
//
// Derived from the Vector implementation in CSG.js
// https://github.com/evanw/csg.js/blob/master/csg.js
// and Three.js Vector3
// http://threejs.org/docs/#Reference/Math/Vector3
//
// Vector objects are immutable, and all functions
// return new Vector objects


var Vector = function(x, y, z) {
  if (arguments.length === 3) {
    this.x = x;
    this.y = y;
    this.z = z;
  } else if ('x' in x) {
    this.x = x.x;
    this.y = x.y;
    this.z = x.z;
  } else {
    this.x = x[0];
    this.y = x[1];
    this.z = x[2];
  }
};

Vector.prototype = {

  clone: function() {
    return new Vector(this.x, this.y, this.z);
  },

  negate: function() {
    return new Vector(-this.x, -this.y, -this.z);
  },

  add: function(a) {
    return new Vector(this.x + a.x, this.y + a.y, this.z + a.z);
  },

  subtract: function(a) {
    return new Vector(this.x - a.x, this.y - a.y, this.z - a.z);
  },

  multiplyScalar: function(a) {
    return new Vector(this.x * a, this.y * a, this.z * a);
  },

  divideScalar: function(a) {
    return new Vector(this.x / a, this.y / a, this.z / a);
  },

  length: function() {
    return Math.sqrt(this.dot(this));
  },

  normalize: function() {
    return this.divideScalar(this.length());
  },

  dot: function(a) {
    return this.x * a.x + this.y * a.y + this.z * a.z;
  },

  cross: function(a) {
    return new Vector(
      this.y * a.z - this.z * a.y,
      this.z * a.x - this.x * a.z,
      this.x * a.y - this.y * a.x
    );
  },

  // http://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Vector_formulation
  distanceToLine: function(a,b) {
    var n = b.subtract(a).normalize();
    var perpendicular = (a.subtract(this)).subtract(n.multiplyScalar(a.subtract(this).dot(n)));
    return perpendicular.length();
  },

  toString: function() {
    return JSON.stringify(this);
  },

};

module.exports = Vector;
},{}]},{},[1])