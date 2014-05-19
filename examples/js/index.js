(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

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

},{"../../../lib/qhull":5,"../../../lib/vector":6,"./trackball":2,"./viewport":3}],2:[function(require,module,exports){

function eventToPosition(event) {
  return {
    x: event.offsetX,
    y: event.offsetY,
  };
}

module.exports = function(viewport) {

  var minDistance = 3;
  var maxDistance = 10000;
  var position = { azimuth: Math.PI/4, elevation: Math.PI*3/8, distance: 40 };
  var target = { azimuth: Math.PI/4, elevation: Math.PI*3/8, distance: 40, scenePosition: new THREE.Vector3()};
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

    viewport.camera.position.x = position.distance * Math.sin(position.elevation) * Math.cos(position.azimuth);
    viewport.camera.position.y = position.distance * Math.sin(position.elevation) * Math.sin(position.azimuth);
    viewport.camera.position.z = position.distance * Math.cos(position.elevation);

    viewport.camera.up = new THREE.Vector3(0,0,1);
    viewport.camera.lookAt(new THREE.Vector3(0,0,0));

  };

  viewport.container.addEventListener('mousemove', that.mousemove, false);
  viewport.container.addEventListener('mousedown', that.mousedown, false);
  viewport.container.addEventListener('mouseup', that.mouseup, false);
  viewport.container.addEventListener('mouseout', that.mouseup, false);
  viewport.container.addEventListener('mousewheel', that.mousewheel, false);

  animate();

};



},{}],3:[function(require,module,exports){

module.exports = function(container) {

  var camera, renderer, light;
  var containerWidth = 400, containerHeight = 400;

  var that = this;
  that.container = container;

  function init() {

    container.style.width  = containerWidth + 'px';
    container.style.height = containerHeight + 'px';

    camera = new THREE.PerspectiveCamera(70, containerWidth / containerHeight, 0.1, 10000 );
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
    renderer.setSize(containerWidth, containerHeight);
    renderer.setClearColor(0xffffff, 1);
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

  }

  function onWindowResize() {
    camera.aspect = containerWidth/containerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(containerWidth, containerHeight);
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

    points.forEach(function(point) {
      var mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshLambertMaterial({color: color}));
      mesh.position = new THREE.Vector3(point.x, point.y, point.z);
      that.exampleObj.add(mesh);
    });
  };

  this.addTriangles = function(triangles, color) {

    triangles.forEach(function(triangle) {

      var geometry = new THREE.Geometry();
      geometry.vertices = triangle.map(function(v) {
        return new THREE.Vector3(v.x, v.y, v.z);
      });
      geometry.faces.push(new THREE.Face3(0,1,2));
      geometry.computeFaceNormals();
      that.exampleObj.add(new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial({color: color})));
    });

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
  var maxDistance = 0;
  var point;
  for (var i = 0; i < points.length; ++i) {
    var distance = basePlane.pointDistance(points[i]);
    if (Math.abs(distance) > Math.abs(maxDistance)) {
      maxDistance = distance;
      point = points[i];
    }
  }
  return {
    point: point,
    distance: maxDistance
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
  var apex = findApex(basePlane, points);

  // Correct normal so that base points away from apex
  if (apex.distance > 0) {
    return {
      base: [a,b,c],
      apex: apex,
    };
  } else {
    return {
      base: [a,c,b],
      apex: apex,
    };
  }

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