"use strict";

var vert_code=`#version 300 es
in vec2 a_position;
in vec2 a_texCoords;

uniform vec2 res;

out vec2 texCoords;

void main()
{
    //convert the pixel locations to (0.0 to 1.0) form
    vec2 zeroOne=a_position/res;

    //convert them to (0.0 to 2.0) form
    vec2 zeroTwo=zeroOne*2.0;

    //convert them to (-1.0 to 1.0) form
    vec2 clipSpace=zeroTwo-1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    texCoords=a_texCoords;
}
`;

var frag_code=`#version 300 es

precision highp float;
in vec2 texCoords;

uniform sampler2D u_image;

out vec4 frag_color;

void main()
{
    frag_color=texture(u_image,texCoords);
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

function setRectangle(gl,x,y,width,height)
{
    var x1,x2,y1,y2;
    x1=x;
    x2=x+width;
    y1=y;
    y2=y+height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1,y1,
        x2,y1,
        x1,y2,
        x1,y2,
        x2,y1,
        x2,y2
    ]),gl.STATIC_DRAW);
}

function render(image)
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

    //Create and bind the vertex array object
    var vao=gl.createVertexArray();
    gl.bindVertexArray(vao);

    //Adding position coordinates
    var pos_buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,pos_buffer);
    setRectangle(gl,0,0,gl.canvas.width,gl.canvas.height);
    var posLoc=gl.getAttribLocation(program,"a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);      

    //Adding texture coordinates
    var texCoords=[
        0.0,0.0,
        1.0,0.0,
        0.0,1.0,
        0.0,1.0,
        1.0,0.0,
        1.0,1.0
    ];
    var tex_buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,tex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(texCoords),gl.STATIC_DRAW);
    var texLoc=gl.getAttribLocation(program,"a_texCoords");
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

    //Setting the texture
    var texture=gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + 0);//make unit 0 the active texture unit
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    var mipLevel = 0;               // the largest mip
    var internalFormat = gl.RGBA;   // format we want in the texture
    var srcFormat = gl.RGBA;        // format of data we are supplying
    var srcType = gl.UNSIGNED_BYTE; // type of data we are supplying
    gl.texImage2D(gl.TEXTURE_2D,mipLevel,internalFormat,srcFormat,srcType,image);

    //Get uniform locations
    var resLoc=gl.getUniformLocation(program, "res");
    var texLoc=gl.getUniformLocation(program,"u_image");
    
    gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
    gl.clearColor(0.0,0.5,0.8,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    //Set the uniforms
    gl.uniform2f(resLoc, gl.canvas.width, gl.canvas.height);
    gl.uniform1i(texLoc,0);
        
    //Draw the triangle
    gl.enable(gl.DEPTH_TEST);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function main()
{
    //Creating image
    var image=new Image();
    image.src="./textures/airplane.png";
    image.onload=function()
    {
        render(image);
    }
}

main();