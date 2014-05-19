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
function findApex(basePlane, points) {
  var maxDistance = -Infinity;
  var apex;
  for (var i = 0; i < points.length; ++i) {
    var distance = Math.abs(basePlane.pointDistance(points[i]));
    if (distance > maxDistance) {
      maxDistance = distance;
      apex = points[i];
    }
  }
  return apex;
}

// Generate the convex hull of a set of points
// points is an array of Vector objects
// Returns the vertices and faces of the hull
module.exports.generate = function(points) {

  var extremePoints = findExtremePoints(points);
  console.log(extremePoints);
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

  var basePlane = new Plane(a,b,c);
  console.log(basePlane);

  var apex = findApex(basePlane, points);
  console.log('base', a, b, c);
  console.log('apex', apex);

  return {};
};



