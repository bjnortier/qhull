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