"use strict";

var vert_code=`#version 300 es
in vec4 a_position;

void main()
{
    gl_Position=a_position;
}
`;

var frag_code=`#version 300 es

precision highp float;

out vec4 frag_color;

void main()
{
    frag_color=vec4(0.6,0.7,0.7,1.0);
}
`;

function makeShader(gl,type,source)
{
    var shader=gl.createShader(type);
    gl.shaderSource(shader,source);
    gl.compileShader(shader);
    var success=gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if(success)
    {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return undefined;
}

function makeProgram(gl,vert_shader,frag_shader)
{
    var program=gl.createProgram();
    gl.attachShader(program, vert_shader);
    gl.attachShader(program, frag_shader);
    gl.linkProgram(program);
    var success=gl.getProgramParameter(program, gl.LINK_STATUS);
    if(success)
    {
        return program;
    }

    console.log(gl.getProgramInfoLog(program)); 
    gl.deleteProgram(program);
    return undefined;
}

function main()
{
    var canvas= document.getElementById('c');
    var gl=canvas.getContext('webgl2');
    if(!gl)
    {
        return;
    }

    //Creating the shaders
    var vert_shader=makeShader(gl,gl.VERTEX_SHADER,vert_code);
    var frag_shader=makeShader(gl,gl.FRAGMENT_SHADER,frag_code);

    //Creating the shader program
    var program=makeProgram(gl,vert_shader,frag_shader);

    //Adding geometry vertices
    var vertices=[-0.5,0.5,-0.5,-0.5,0.0,-0.5];

    var pos_buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,pos_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),gl.STATIC_DRAW);

    var vao=gl.createVertexArray();
    gl.bindVertexArray(vao);
    var posLoc=gl.getAttribLocation(program,"a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    
    gl.viewport(0,0,gl.canvas.width,gl.canvas.height);

    gl.clearColor(0.7,0.5,0.8,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    //Draw the triangle

    gl.enable(gl.DEPTH_TEST);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

main();