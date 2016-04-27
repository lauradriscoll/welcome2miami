var equirect = require('google-panorama-equirectangular')
var panorama = require('google-panorama-by-location')
var regl = require('regl')()

var mesh = require('primitive-icosphere')(1, {
  subdivisions: 3
})

console.log(mesh)

var canvas = document.createElement('canvas')

// a street view in Tokyo
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
      regl({
        frag: `
        precision mediump float;
        uniform sampler2D texture;
        varying vec2 uv;
        void main () {
          gl_FragColor = texture2D(texture, uv);
        }`,

        vert: `
        precision mediump float;
        attribute vec3 position;
        varying vec2 uv;
        void main () {
          uv = position;
          gl_Position = vec4(1.0 - 2.0 * position, 0, 1);
        }`,

        attributes: {
          position: regl.buffer(mesh.positions),
          uv: regl.buffer(mesh.uv)
        },

        uniforms: {
          texture: regl.texture(canvas),
        },

        count: 3
      })()
    })
    .on('progress', function (ev) {
      console.log('loading texture')
    })
})

