var mat4 = require('gl-mat4')
var sphere = require('primitive-icosphere')
var bunny = require('bunny')
var fit = require('canvas-fit')
var normals = require('angle-normals')
var extrude = require('extrude')
var shape 

var mesh = sphere(1, {
  subdivisions: 3
})

var vectorizeText = require('vectorize-text')
 
var textmesh = vectorizeText('welcome to miami', {
  triangles: true,
  width: 500,
  textBaseline: 'hanging',
  font: 'Futura'
})
textmesh.positions = textmesh.positions.map(function (p) {
  return [p[0], p[1], 0]
})

var equirect = require('google-panorama-equirectangular')
var panorama = require('google-panorama-by-location')

var canvas = document.body.appendChild(document.createElement('canvas'))
var regl = require('regl')(canvas)
var camera = require('canvas-orbit-camera')(canvas)
window.addEventListener('resize', fit(canvas), false)

var canvas = document.createElement('canvas')

function setup() {
  var cube = regl({
    frag: `
      precision mediump float;
      uniform sampler2D texture;
      varying vec2 vuv;
      varying vec3 vnormal;
      void main () {
        gl_FragColor = mix(vec4(0.1, 0.1, 0.1, 1.0), texture2D(texture, vuv), 0.5);
      }`,
    vert: `
      precision mediump float;
      uniform mat4 proj;
      uniform mat4 model;
      uniform mat4 view;
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;
      varying vec3 vnormal;
      varying vec2 vuv;
      void main () {
        vnormal = normal;
        vuv = uv;
        gl_Position = proj * view * model * vec4(position, 1.0);
      }`,
    attributes: {
      position: regl.buffer(mesh.positions),
      normal: regl.buffer(normals(mesh.cells, mesh.positions)),
      uv: regl.buffer(mesh.uvs)
    },
    elements: regl.elements(mesh.cells),
    uniforms: {
      proj: mat4.perspective([], Math.PI / 2, window.innerWidth / window.innerHeight, 0.01, 1000),
      model: mat4.scale(mat4.identity([]), mat4.identity([]), [5, 5, 5]),
      view: regl.prop('view'),
      texture: regl.texture(canvas)
    }
  })

  var welcome = regl({
    frag: `
      precision mediump float;
      varying vec3 vnormal;
      void main () {
        gl_FragColor = vec4(1.0, 0.1, 0.6, 1.0);
      }`,
    vert: `
      precision mediump float;
      uniform mat4 proj;
      uniform mat4 model;
      uniform mat4 view;
      attribute vec3 position;
      attribute vec3 normal;
      varying vec3 vnormal;
      void main () {
        vnormal = normal;
        gl_Position = proj * view * model * vec4(position, 1.0);
      }`,
    attributes: {
      position: regl.buffer(textmesh.positions),
      normal: regl.buffer(normals(textmesh.cells, textmesh.positions)),
    },
    elements: regl.elements(textmesh.cells),
    uniforms: {
      proj: mat4.perspective([], Math.PI / 2, window.innerWidth / window.innerHeight, 0.01, 1000),
      model: mat4.rotateY(mat4.identity([]), mat4.scale(mat4.identity([]), mat4.identity([]), [0.01, 0.01, 0.01]), Math.PI / 2),
      view: regl.prop('view')
    }

  })

  regl.frame(function (count) {
    regl.clear({
      color: [0, 0, 0, 1]
    })
    camera.tick()
    welcome({
      view: camera.view()
    })
    cube({
      view: camera.view()
    })
  })
}

var location = [25.7794081,-80.1308771]
panorama(location, function (err, result) {
  if (err) throw err

  // load the equirectangular image
  equirect(result.id, {
    tiles: result.tiles,
    canvas: canvas,
    crossOrigin: 'Anonymous',
    zoom: 4
  })
    .on('complete', function (image) {
      setup()
    })
    .on('progress', function (ev) {
      console.log('loading texture')
    })
})
