(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var qhull = require('../lib/qhull');
window.QHull = qhull;
},{"../lib/qhull":3}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
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
function init(points) {

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

}

// Iterate the algorithm by findind the next face with points
// and adding new faces from the horizon to the most distant point
//
// returns the selected point and light face indices for debugging
// or `undefined` if there are no more points.
function iterate(mesh) {
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
}

module.exports.init = init;
module.exports.iterate = iterate;

// Create the convex hull fomr the points
module.exports.generate = function(points) {
  var mesh = init(points);
  var result;
  do {
    result = iterate(mesh);
  } while (result);
  return mesh;
};
},{"./plane":2,"./vector":4}],4:[function(require,module,exports){
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