"use strict";

// 3D Convex hull of a set of points
// Described here:
// http://thomasdiewald.com/blog/?p=1888
//
// Some inspiraton from https://github.com/marklundin/quickhull

var Vector = require('./vector');
var Plane = require('./plane');

module.exports.Vector = Vector;

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

// Generate the convex hull of a set of points
// points is an array of Vector objects
// Returns the vertices and faces of the hull
module.exports.setup = function(points) {

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

  var tetrahedron = {
    vertices: [a,b,c,apex.point],
    faces: [{a:0, b:1, c:2}, {a:0, b:3, c:1}, {a:3, b:2, c:1}, {a:0, b:2, c:3}]
  };
  return {
    base: base,
    apex: apex,
    tetrahedron: tetrahedron,
  };

};

// Assign points to faces, by assigning point to first face it is in front of
// Return an array of the same size as the mesh faces array, with the points
// for that face
module.exports.assignPointsToFaces = function(points, mesh) {
  var faces = mesh.faces.slice(0);
  var vertices = mesh.vertices.slice(0);

  for (var i = 0; i < points.length; ++i) {
    var point = points[i];
    for (var k = 0; k < faces.length; ++k) {
      var face = faces[k];
      var plane = new Plane(vertices[face.a], vertices[face.b], vertices[face.c]);
      if (plane.pointDistance(point) > 0) {
        if (!faces[k].hasOwnProperty('points')) {
          faces[k].points = [];
        }
        faces[k].points.push(point);
        break;
      }
    }
  }
  return faces;
};

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
      var face = mesh.faces[adjacentFaceIndices[i]];
      var plane = new Plane(mesh.vertices[face.a], mesh.vertices[face.b], mesh.vertices[face.c]);
      if ((plane.pointDistance(point) > 0) && (lightFaces.indexOf(i) === -1)) {
        lightFaces.push(i);
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

module.exports.popNext = function(mesh) {
  // Find the next face in the mesh with points
  for (var i = 0; i < mesh.faces.length; ++i) {
    var face = mesh.faces[i];
    if (face.points && face.points.length) {
      var plane = new Plane(mesh.vertices[face.a], mesh.vertices[face.b], mesh.vertices[face.c]);
      var mostDistant = findMostDistantFromPlane(plane, face.points);
      var lightFaces = findLightFaces(mostDistant.point, mesh, [i]);
      var horizonEdges = findHorizonEdges(mesh, lightFaces);
      console.log('lightFaces', lightFaces);
      console.log('horizonEdges', horizonEdges);

      // Create new faces using the point and the horinzon edges
      var newVertexIndex = mesh.vertices.push(mostDistant.point) - 1;
      horizonEdges.forEach(function(edge) {
        mesh.faces.push({a: edge[0], b: edge[1], c: newVertexIndex});
      });

      // Remove the light faces from the mesh
      mesh.faces.reduce(function(acc, f, i) {
        if (lightFaces.indexOf(i) === -1) {
          acc.push(i);
        }
        return acc;
      }, []);
      return;
    }
  }
};