
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