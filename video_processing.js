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
uniform float u_kernel[9];
uniform float u_kernelWeight;

out vec4 frag_color;

void main()
{
   /* vec2 pixel=vec2(1.0)/vec2(textureSize(u_image,0));
    //frag_color=texture(u_image,texCoords);
    vec4 colorSum=texture(u_image,texCoords+pixel*vec2(-1,-1))*u_kernel[0]+
    texture(u_image,texCoords+pixel*vec2(0,-1))*u_kernel[1]+
    texture(u_image,texCoords+pixel*vec2(1,-1))*u_kernel[2]+
    texture(u_image,texCoords+pixel*vec2(-1,0))*u_kernel[3]+
    texture(u_image,texCoords+pixel*vec2(0,0))*u_kernel[4]+
    texture(u_image,texCoords+pixel*vec2(1,0))*u_kernel[5]+
    texture(u_image,texCoords+pixel*vec2(-1,1))*u_kernel[6]+
    texture(u_image,texCoords+pixel*vec2(0,1))*u_kernel[7]+
    texture(u_image,texCoords+pixel*vec2(1,1))*u_kernel[8]; 

    frag_color=vec4((colorSum/u_kernelWeight).rgb,1);*/
    vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));
    vec4 colorSum =texture(u_image, texCoords + onePixel * vec2(-1, -1)) * u_kernel[0] +
    texture(u_image, texCoords + onePixel * vec2( 0, -1)) * u_kernel[1] +
    texture(u_image, texCoords + onePixel * vec2( 1, -1)) * u_kernel[2] +
    texture(u_image, texCoords + onePixel * vec2(-1,  0)) * u_kernel[3] +
    texture(u_image, texCoords + onePixel * vec2( 0,  0)) * u_kernel[4] +
    texture(u_image, texCoords + onePixel * vec2( 1,  0)) * u_kernel[5] +
    texture(u_image, texCoords + onePixel * vec2(-1,  1)) * u_kernel[6] +
    texture(u_image, texCoords + onePixel * vec2( 0,  1)) * u_kernel[7] +
    texture(u_image, texCoords + onePixel * vec2( 1,  1)) * u_kernel[8] ;
    frag_color = vec4((colorSum / u_kernelWeight).rgb, 1);
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

function render(video)
{
    console.log("Render is called")
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
    setRectangle(gl,0,0,image.width,image.height);
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
    var filler=new Uint8Array([255,0,0,1]);
    gl.texImage2D(gl.TEXTURE_2D,mipLevel,internalFormat,srcFormat,srcType,video);
    
    /*const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);*/

    //Get uniform locations
    var resLoc=gl.getUniformLocation(program, "res");
    var texLoc=gl.getUniformLocation(program,"u_image");
    var kernelLoc=gl.getUniformLocation(program,"u_kernel[0]");
    var kernelWeightLoc=gl.getUniformLocation(program,"u_kernelWeight");

    gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
    gl.clearColor(0.0,0.5,0.8,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    kernel_menu();
    function kernel_menu()
    {
    var kernels = {
        normal: [
          0, 0, 0,
          0, 1, 0,
          0, 0, 0,
        ],
        gaussianBlur: [
          0.045, 0.122, 0.045,
          0.122, 0.332, 0.122,
          0.045, 0.122, 0.045,
        ],
        gaussianBlur2: [
          1, 2, 1,
          2, 4, 2,
          1, 2, 1,
        ],
        gaussianBlur3: [
          0, 1, 0,
          1, 1, 1,
          0, 1, 0,
        ],
        unsharpen: [
          -1, -1, -1,
          -1,  9, -1,
          -1, -1, -1,
        ],
        sharpness: [
           0, -1,  0,
          -1,  5, -1,
           0, -1,  0,
        ],
        sharpen: [
           -1, -1, -1,
           -1, 16, -1,
           -1, -1, -1,
        ],
        edgeDetect: [
           -0.125, -0.125, -0.125,
           -0.125,  1,     -0.125,
           -0.125, -0.125, -0.125,
        ],
        edgeDetect2: [
           -1, -1, -1,
           -1,  8, -1,
           -1, -1, -1,
        ],
        edgeDetect3: [
           -5, 0, 0,
            0, 0, 0,
            0, 0, 5,
        ],
        edgeDetect4: [
           -1, -1, -1,
            0,  0,  0,
            1,  1,  1,
        ],
        edgeDetect5: [
           -1, -1, -1,
            2,  2,  2,
           -1, -1, -1,
        ],
        edgeDetect6: [
           -5, -5, -5,
           -5, 39, -5,
           -5, -5, -5,
        ],
        sobelHorizontal: [
            1,  2,  1,
            0,  0,  0,
           -1, -2, -1,
        ],
        sobelVertical: [
            1,  0, -1,
            2,  0, -2,
            1,  0, -1,
        ],
        previtHorizontal: [
            1,  1,  1,
            0,  0,  0,
           -1, -1, -1,
        ],
        previtVertical: [
            1,  0, -1,
            1,  0, -1,
            1,  0, -1,
        ],
        boxBlur: [
            0.111, 0.111, 0.111,
            0.111, 0.111, 0.111,
            0.111, 0.111, 0.111,
        ],
        triangleBlur: [
            0.0625, 0.125, 0.0625,
            0.125,  0.25,  0.125,
            0.0625, 0.125, 0.0625,
        ],
        emboss: [
           -2, -1,  0,
           -1,  1,  1,
            0,  1,  2,
        ],
      };

      var initialSelection = 'edgeDetect2';
      var selection=initialSelection;
      var ui=document.getElementById("ui");
      var select=document.createElement("select");
      for(var kernel in kernels)
      {
          var option=document.createElement("option");
          option.value=kernel;
          if (kernel=== initialSelection)
            {
            option.selected = true;
          }
          option.appendChild(document.createTextNode(kernel));
          select.appendChild(option);
      }
      select.onchange=function(){
          selection=this.options[this.selectedIndex].value;
          control(kernels[selection]);
      }
      control(kernels[initialSelection]);
      ui.appendChild(select);
    }

    function control(kernel)
    {
        console.log("Its called");
        updateTexture(texture,video);
        drawImage(kernel);
        window.requestAnimationFrame(control);
    }
    function drawImage(kernel)
    {
        var kernelWeight=computeWeight(kernel);

        //Set the uniforms
        gl.uniform2f(resLoc, gl.canvas.width, gl.canvas.height);
        gl.uniform1i(texLoc,0);
        gl.uniform1fv(kernelLoc, kernel);
        gl.uniform1f(kernelWeightLoc, kernelWeight);
        
        //Draw the triangle
        gl.enable(gl.DEPTH_TEST);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}

function computeWeight(mat)
{
    var sum=0;
    for(var int in mat)
    {
        sum+=mat[int];
    }
    if(sum>0)
        return sum;
    else
        return 1.0;
}
function setupVideo()
{

    var playing =false;
    var timeUpdate=false;
    video.src=document.getElementById("videoTex").src;
    video.autoplay=true;
    video.muted=true;

    video.addEventListener('playing',setPlaying,true);
    video.addEventListener('timeUpdate',setTimeUpdate,true);
    
    function setPlaying()
    {
        console.log("setPlaying is done");
        playing=true;
        checkReady();
    }
    function setTimeUpdate()
    {
        console.log("timeUpdate is done");
        timeUpdate=true;
        checkReady();
    }

    video.src=document.getElementById("videoTex").src;
    video.play();

    function checkReady()
    {
        if((playing==true) || (timeUpdate==true))
        {
            console.log("checkReady is done");
            videoReady=true;
            render(video);
        }
    }
}

function updateTexture(texture, video) 
{
    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, video);
  }

  //Creating image
var canvas= document.getElementById('c');
var gl=canvas.getContext('webgl2');
if(gl)
{
    console.log("WebGL works");
}
var image=new Image();
//image.src="./textures/airplane.png";
var extra=document.getElementById("texture");
image.src=extra.src;
console.log(image.src);
image.onload=function()
{
    //render(image);
}

var videoReady=false;
var video=document.createElement("video");
setupVideo();
document.getElementById("clickBody").addEventListener('click', function() 
{
    video.muted = !video.muted;
});

