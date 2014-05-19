
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