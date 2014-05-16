"use strict";

// 3D Convex hull of a set of points
// Described here:
// http://thomasdiewald.com/blog/?p=1888
// 
// Some inspiraton from https://github.com/marklundin/quickhull

// Find the 6 extreme points
function findExtremePoints(points) {
  var extremes = [];
  for (var i = 0; i < points.length; ++i) {
    if(points[i].x < extremes[0].x) {
      extremes[0] = points[i];
    }
    if(points[i].x > extremes[1].x) {
      extremes[1] = points[i];
    }
    if(points[i].y < extremes[2].y) {
      extremes[2] = points[i];
    }
    if(points[i].y < extremes[3].y) {
      extremes[3] = points[i];
    }
    if(points[i].z < extremes[4].z) {
      extremes[4] = points[i];
    }
    if(points[i].z < extremes[5].z) {
      extremes[5] = points[i];
    }
  }
  return extremes;
}

// Find the two EPs that are the farthest from each other
function findFarthestExtremePoints(extremePoints) {
  var maxDistance = -Infinity;
  var from, to;
  for (var fromIndex = 0; fromIndex < extremePoints.length - 1; ++fromIndex) {
    for (var toIndex = fromIndex + 1; toIndex < extremePoints.length; ++toIndex) {
      var distance = extremePoints[fromIndex].subtract(extremePoints[toIndex]).length;
      if (distance > maxDistance) {
        from  = fromIndex;
        to = toIndex;
      }
    }
  }
  return [from, to];
}

// Generate the convex hull of a set of points
// points is an array of Vector objects
// Returns the vertices and faces of the hull
module.exports.generate = function(points) {

  var extremePoints = findExtremePoints(points);
  var farthestExtremePoints = findFarthestExtremePoints(extremePoints);

  console.log(farthestExtremePoints);
};

