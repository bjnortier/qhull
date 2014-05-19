(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

  var basePlane = new Plane(a,b,c);
  console.log(basePlane);

  var apex = findApex(basePlane, points);

  return {
    base: [a,b,c],
    apex: apex,
  };
};




},{"./plane":2,"./vector":3}],2:[function(require,module,exports){
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