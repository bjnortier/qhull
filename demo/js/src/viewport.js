
module.exports = function(container) {

  var camera, renderer, light;
  var that = this;
  that.container = container;

  function onWindowResize() {
    var containerWidth = $(container).width();
    container.style.height = containerWidth + 'px';
    camera.aspect = 1.0;
    camera.updateProjectionMatrix();
    renderer.setSize(containerWidth-1, containerWidth-1);
    return containerWidth;
  }

  function init() {

    camera = new THREE.PerspectiveCamera(70, 1.0, 0.1, 10000 );
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
    renderer.setClearColor(0xffffff, 1);
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();
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

    var particles = new THREE.Geometry();
    particles.vertices = points.map(function(point) {
      return new THREE.Vector3(point.x, point.y, point.z);
    });

    var pMaterial = new THREE.ParticleBasicMaterial({
      color: color,
      size: size,
    });
    var particleSystem = new THREE.ParticleSystem(
      particles,
      pMaterial);
    that.exampleObj.add(particleSystem);
  };

  this.addMesh = function(mesh, color) {

    var geometry = new THREE.Geometry();
    geometry.vertices = mesh.vertices.map(function(v) {
      return new THREE.Vector3(v.x, v.y, v.z);
    });
    geometry.faces = mesh.faces.map(function(f) {
      return new THREE.Face3(f.a, f.b, f.c);
    });
    geometry.computeFaceNormals();
    this.exampleObj.add(
      THREE.SceneUtils.createMultiMaterialObject(geometry, [
        new THREE.MeshLambertMaterial({color: color, transparent: true, opacity: 0.5}),
        new THREE.MeshBasicMaterial({color: color, wireframe: true, linewidth: 5}),
      ]));
  };

  this.clear = function() {
    this.scene.remove(this.exampleObj);
    this.exampleObj = new THREE.Object3D();
    this.scene.add(this.exampleObj);
  };

  init();
  animate();


};