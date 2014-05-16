var chai = require('chai');
var assert = chai.assert;

var Vector = require('../lib/vector');

describe('Vector', function() {

  it('can be created', function() {
    var a = new Vector(1,2,3);
    assert.equal(a.x, 1);
    assert.equal(a.y, 2);
    assert.equal(a.z, 3);
  });

  it('has a distance to a line', function() {
    var a = new Vector(0,0,-10);
    var b = new Vector(0,0,10);
    var p = new Vector(10,0,0);
    assert.equal(p.distanceToLine(a,b), 10);

    a = new Vector(0,0,0);
    b = new Vector(1,1,0);
    p = new Vector(5,5,7);
    assert.equal(p.distanceToLine(a,b), 7);
  });

});