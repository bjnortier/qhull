var chai = require('chai');
var assert = chai.assert;

var Vector = require('../lib/vector');
var Plane = require('../lib/plane');

describe('Plane', function() {

  it('distance to point', function() {
    var a = new Vector(0,0,1);
    var b = new Vector(10,0,1);
    var c = new Vector(0,10,1);
    var plane = new Plane(a,b,c);

    assert.equal(plane.pointDistance(new Vector(0,0,5)), 4);

    a = new Vector(10,0,0);
    b = new Vector(0,10,0);
    c = new Vector(0,0,10);
    plane = new Plane(a,b,c);

    assert.isTrue(Math.abs(plane.pointDistance(new Vector(3.3333,3.3333,3.3333))) < 0.0001);
  });

});