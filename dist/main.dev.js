"use strict";

var canvas = document.getElementById('mycanvas');
var gl = canvas.getContext('experimental-webgl'); //Adding geometry vertices

var vertices = [-0.5, 0.5, -0.5, -0.5, 0.0, -0.5];
var vert_buffer = gl.bindBuffer(target, buffer);
gl.clearColor(0.8, 0.7, 0.9, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);