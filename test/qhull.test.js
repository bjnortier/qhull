var chai = require('chai');
var assert = chai.assert;

var qhull = require('..');
var Vector = qhull.Vector;

describe('Vector', function() {

  it('can be created', function() {

    var cube = [
      new Vector(0,0,0),
      new Vector(10,0,0),
      new Vector(10,20,0),
      new Vector(0,20,0),
      new Vector(0,0,30),
      new Vector(10,0,30),
      new Vector(10,20,30),
      new Vector(0,20,30),
    ];

    var setup = qhull.setup(cube);

    console.log(setup);
    assert.isTrue(true);
  });

});