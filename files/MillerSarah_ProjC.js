//Sarah Miller - EECS 351 Proj C
//Based on modified JT code + book code

// Vertex shader program
var VSHADER_SOURCE =

  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +        // Normal
  
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +    // Model matrix
  'uniform mat4 u_NormalMatrix;\n' +   // Coordinate transformation matrix of the normal
  
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  
  ///???
  'uniform vec3 u_Kd; \n' +
  'varying vec3 v_Kd; \n' +
  
   'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * a_Position;\n' +
     // Calculate the vertex position in the world coordinate
  '  v_Position = vec3(u_ViewMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Color = a_Color;\n' +
  '  v_Kd = u_Kd; \n' +
  '}\n';
  
  
// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform vec3 u_LightDiffuseColor;\n' +     // Diffuse Light color
  'uniform vec3 u_LightPosition;\n' +  // Position of the light source
  'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
  'uniform vec3 u_Specular;\n' +
  
  'uniform vec3 u_HeadlightDiffuse;\n' +     // Diffuse Light color
  'uniform vec3 u_HeadightPosition;\n' +  // Position of the light source
  'uniform vec3 u_HeadlightSpecular;\n' +
  
  
  'uniform vec3 u_Ks;\n' +
  'uniform vec3 u_Ke;\n' +
  'uniform vec3 u_Ka;\n' +
  
  'varying vec3 v_Kd;	\n' +
  
  'uniform vec4 u_eyePosWorld; \n' + 

  
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Color;\n' +
  //Crazy Light
  'uniform vec3 u_SpecularC;\n' +
   'uniform vec4 u_eyePosWorldC; \n' + 
  'uniform float u_MaterialShininess;\n' +
  
  'uniform bool CrazyLighting;\n' +
  'uniform bool materials_on;\n' +
  
  ///
  
  
  
  'void main() {\n' +
     // Normalize the normal because it is interpolated and not 1.0 in length any more
  '  vec3 normal = normalize(v_Normal);\n' +
     // Calculate the light direction and make its length 1.
  '  vec3 lightDirection = normalize(u_LightPosition - v_Position);\n' +
  '  vec3 hLightDirection = normalize(u_HeadightPosition - v_Position);\n' +
  
     // Formerly nDotL
  '  float diffuseLightWeighting = max(dot(lightDirection, normal), 0.0);\n' +
  '  float hDiffuseLightWeighting = max(dot(hLightDirection, normal), 0.0);\n' +
     
  '  vec3 eyeDirection = normalize(u_eyePosWorld.xyz - v_Position.xyz); \n' +
  '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
  '  float nDotH = max(dot(H, normal), 0.0); \n' +
			// (use max() to discard any negatives from lights below the surface)
			// Apply the 'shininess' exponent K_e:
	'  float e02 = nDotH*nDotH; \n' +
	'  float e04 = e02*e02; \n' +
	'  float e08 = e04*e04; \n' +
	'	 float e16 = e08*e08; \n' +
	'	 float e32 = e16*e16; \n' + 
	'	 float e64 = e32*e32;	\n' +
 //CRAZY
 
 'vec3 eyeDirectionC = normalize(-v_Position.xyz);\n' +
  'vec3 reflectionDirection = reflect(-lightDirection, normal);\n' +
  'float specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirectionC), 0.0), 0.0);\n' +
   '  vec3 specC = u_SpecularC * u_Ks * specularLightWeighting;\n' +
 
 
     //GOOD WORKING STUFF
     
  '  vec3 diffuse = u_LightDiffuseColor * vec3(v_Color) * diffuseLightWeighting;\n' +
  '  vec3 ambient = u_AmbientLight * v_Color.rgb;\n' +
  //'  vec3 spec = u_Specular * u_Ks * e32;\n' +
  '  vec3 spec = u_Specular * (1.8,1.8,1.8) * e32;\n' +
  '	 vec3 emissive = u_Ke;' +
    //HEADLIGHT
    '  vec3 hdiffuse = u_HeadlightDiffuse * vec3(v_Color) * hDiffuseLightWeighting;\n' +
    '  vec3 hspec = u_HeadlightSpecular * u_Ks * e32;\n' +
    
  'if (CrazyLighting) {\n' + 
  '  gl_FragColor = vec4(hdiffuse + diffuse + ambient + spec + hspec + specC, 1.0);}\n' +
  'else if (materials_on) {\n' +
  '  hdiffuse = u_HeadlightDiffuse * v_Kd * hDiffuseLightWeighting;\n' +
  '  ambient = u_AmbientLight * u_Ka;\n' +
  '  diffuse = u_LightDiffuseColor * v_Kd * diffuseLightWeighting;\n' +
  '  spec = u_Specular * u_Ks * e32;\n' +
  '  gl_FragColor = vec4(diffuse + ambient + spec + hdiffuse + hspec + emissive, 1.0);}\n' +
  
  'else { gl_FragColor = vec4(hdiffuse + diffuse + ambient + spec + hspec + emissive, 1.0);}\n' +
  
  '}\n';
  
  


//GLOBALS
  
//EYE AND CAMERA STUFF
var g_EyeX = 0.20, g_EyeY = 0.25, g_EyeZ = 4.25;
var lookX = 0, lookY = 0, lookZ = 0;
var xAng = 0;

//LIGTHS
var LCR = 1.0, LCG = 1.0, LCB = 1.0;
var LPX = 2.0, LPY = 2.0, LPZ = 2.0;
var AR = 0.5, AG = 0.5, AB = 0.5;

var ANGLE_STEP = 10.0;  	//default rotation angle rate (degrees/second)
var floatsPerVertex = 6;	// # of Float32Array elements used for each vertex (x,y,z)position + (r,g,b)color
var currentAngle = 0.0;  	//Start Angle
var projMatrix = new Matrix4();  
nPetals = 9;  			//Default #Flower petals
var ax = .5;			//??
var starSpin = 1;		//Star is spinning

// MOUSE DRAG STUFF
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;

//IDEK...LIGHTING/MATERIALS?

//LIGHTS ON OFF
var lights_on = true;
var headlight = true;
var crazy = false;
var materials_on = true;

//		-- For 3D scene:
var uLoc_eyePosWorld 	= false;
var uLoc_ModelMatrix 	= false;
var uLoc_MvpMatrix 		= false;
var uLoc_NormalMatrix = false;

// ... for Phong material/reflectance:
var uLoc_Ke = false;
var uLoc_Ka = false;
var uLoc_Kd = false;
var uLoc_Kd2 = false;			// for K_d within the MatlSet[0] element.l
var uLoc_Ks = false;
var uLoc_Kshiny = false;

//  ... for 3D scene variables (previously used as arguments to draw() function)
var canvas 	= false;
var gl 		= false;
var n_vcount= false;	// formerly 'n', but that name is far too vague and terse  to use safely as a global variable.


//SOMETHING ABOUT CAMERA?? STILL IDK
var	eyePosWorld = new Float32Array(3);	// x,y,z in world coords
//  ... for our transforms:
var 	modelMatrix = new Matrix4();  		// Model matrix
var	mvpMatrix 	= new Matrix4();	// Model-view-projection matrix
var	normalMatrix = new Matrix4();		// Transformation matrix for normals


//END GLOBALS

function main() {

  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');
  //RESIZE
  gl = getWebGLContext(canvas);
  resizeCanvas(canvas, gl);
  gl = getWebGLContext(canvas);
  // Get the rendering context for WebGL
  
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }	
  // Set the vertex coordinates and color (the blue triangle is in the front)
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to specify the vertex information');
    return;
  }
  
  gl.clearColor(0.2, 0.15, 0.2, 1.0);
  gl.enable(gl.DEPTH_TEST); 
  canvas.onmousedown =	function(ev){myMouseDown( ev, gl, canvas) }; 
  canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) }; //used for dragging
  canvas.onmouseup   = 	function(ev){myMouseUp(   ev, gl, canvas)}; //used for dragging

  
  // Get the storage locations of uniform variables and so on
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  
  
  var u_LightDiffuseColor = gl.getUniformLocation(gl.program, 'u_LightDiffuseColor');
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  var u_Specular = gl.getUniformLocation(gl.program, 'u_Specular');
  
  //HEADLIGHT
  var u_HeadlightDiffuse = gl.getUniformLocation(gl.program, 'u_HeadlightDiffuse');
  var u_HeadlightPosition = gl.getUniformLocation(gl.program, 'u_HeadlightPosition');
  var u_HeadlightSpecular = gl.getUniformLocation(gl.program, 'u_HeadlightSpecular');
  //CRAZY
  var u_SpecularC = gl.getUniformLocation(gl.program, 'u_SpecularC');
  var b_SpecularC = gl.getUniformLocation(gl.program, 'CrazyLighting');
  gl.uniform3f(u_SpecularC, 0.5,0.0,0.6);
  
  gl.uniform3f(u_HeadlightDiffuse, 1.0,1.0,1.0);
  gl.uniform3f(u_HeadlightSpecular, 1.0,1.0,1.0);
  gl.uniform3f(u_HeadlightPosition, -1.0,1.0,-1.0);
  //MATERIALS???
  var b_Materials = gl.getUniformLocation(gl.program, 'materials_on');
  var u_Ks = gl.getUniformLocation(gl.program, 'u_Ks');
  var u_Ka = gl.getUniformLocation(gl.program, 'u_Ka');
  var u_Kd = gl.getUniformLocation(gl.program, 'u_Kd');
  var u_Ke = gl.getUniformLocation(gl.program, 'u_Ke');
  gl.uniform3f(u_Ks, 1.8, 1.8, 1.8); //shinyness? idk
  gl.uniform3f(u_Ka, 0.6, 0.3, 0.3);				// Ka ambient
  gl.uniform3f(u_Kd, 0.3, 0.3, 0.3);	//diffuse
 

  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

  
  // Create a JavaScript matrix to specify the view transformation
  var viewMatrix = new Matrix4();
  var normalMatrix = new Matrix4();
  var modelMatrix = new Matrix4();  // Model matrix
  
  // Register the event handler to be called on key press
 document.onkeydown= function(ev){keydown(ev, gl, u_ViewMatrix, viewMatrix); };    
  
  
  
  // Start drawing
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    resizeCanvas(canvas, gl);
    gl = getWebGLContext(canvas);
    if (headlight) {
      gl.uniform3f(u_HeadlightDiffuse, 1.0,1.0,1.0);
  gl.uniform3f(u_HeadlightSpecular, 1.0,1.0,1.0);
  gl.uniform3f(u_HeadlightPosition, -1.0,1.0,-1.0);
    }
    else {
      gl.uniform3f(u_HeadlightDiffuse, 0.0,0.0,0.0);
      gl.uniform3f(u_HeadlightSpecular, 0.0,0.0,0.0);
    }
    gl.uniform1i(b_SpecularC, crazy);
    gl.uniform1i(b_Materials, materials_on);
    
    draw(gl, projMatrix, u_ViewMatrix, viewMatrix, u_ProjMatrix, canvas, u_NormalMatrix, normalMatrix,
	 u_LightDiffuseColor, u_LightPosition, u_AmbientLight, u_Specular, u_HeadlightPosition,
	 u_Ks, u_Kd, u_Ka, u_Ke) ; 
    
    requestAnimationFrame(tick, canvas);   // Request that the browser ?calls tick
  };
  tick();
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

	var xcount = 100;			// # of lines to draw in x,y to make the grid.
	var ycount = 100;		
	var xymax = 50.0;			// grid size; extends to cover +/-xymax in x and y.
 	var xColr = new Float32Array([0.5, 0.0, 0.9]);	// bright yellow
 	var yColr = new Float32Array([1.0, 0.0, 0.5]);
 	
	// Create an (global) array to hold this ground-plane's vertices:
	gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
						// draw a grid made of xcount+ycount lines; 2 vertices per line.
						
	var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
	var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
	
	// First, step thru x values as we make vertical lines of constant-x:
	for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
		if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j  ] = -xymax + (v  )*xgap;	// x
			gndVerts[j+1] = -xymax;								// y
			gndVerts[j+2] = -0.1;									// z
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
			gndVerts[j+1] = xymax;								// y
			gndVerts[j+2] = 0.0;									// z
		}

		gndVerts[j+3] = Math.random();			// red
		gndVerts[j+4] = 0.1;			// grn
		gndVerts[j+5] = Math.random();			// blu
	}
	// Second, step thru y values as wqe make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
		if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j  ] = -xymax;								// x
			gndVerts[j+1] = -xymax + (v  )*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j  ] = xymax;								// x
			gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
		}
		gndVerts[j+3] = 0.1;			// red
		gndVerts[j+4] = 0.1;			// grn
		gndVerts[j+5] = 0.9;			// blu
	}
}

function initVertexBuffers(gl) {
//==============================================================================

	// make all objects
  forestVerts = new Float32Array([
     //FLOWER
     //Center
     0.0, 0.0, -0.1, 		0.0, 0.0, 0.0,		//0
     0.0, -0.3, 0.0, 		0.4, 0.2, 0.4,		//1
     -0.29, -0.09, 0.0,		0.5, 0.3, 0.2,		//2
     -0.18,0.24, 0.0, 		0.3, 0.3, 0.15,		//3
     0.18, 0.24, 0.0, 		0.4, 0.2, 0.3,		//4
     0.29, -0.09, 0.0, 		0.3, 0.2, 0.3,		//5
     0.0, -0.3, 0.0, 		0.3, 0.2, 0.1,		//6==1
     
     //Petal1
     0.2, 0.3, 0.0, 		.96, 0.23, 0.22,		//0 (n=35)
     0.07, 0.0, 0.0, 		.96, 0.23, 0.92,		//1
     0.0, 0.3, 0.0, 		.99, 0.50, 0.10,		//2
     -0.07, 0.0, 0.0, 		.96, 0.23, 0.72,		//3
     -0.2, 0.3, 0.0, 		1.0, 0.2, 0.0,		//4
     //Petal2
     0.2, 0.0, 0.0, 		.99, 0.20, 0.10,		//0 (n=40)
     0.1, 0.3, 0.0, 		0.9, 0.7, 0.2,		//1
     0.0, 0.0, 0.0, 		.99, 0.50, 0.10,		//2
     -0.1, 0.3, 0.0, 		0.9, 0.4, 0.3,		//3
     -0.2, 0.0, 0.0, 		.99, 0.20, 0.10,		//4
     //PetalTip
     0.1, 0.0, 0.0, 		0.9, 0.7, 0.2,
     0.0, 0.2, 0.0, 		0.9, 0.9, 0.0,
     -0.1, 0.0, 0.0, 		0.9, 0.4, 0.3,
     //n = 27
     


     //STAR
     0.0, 0.0, -0.1, 		1.0, 1.0, 1.0,		//0Cent
     0.0, -0.3, 0.0, 		1.0, 0.0, 0.0,		//PT1
     -0.1, -0.09, 0.0, 		0.3, 0.2, 0.3,		//IN1
     -0.29, -0.09, 0.0,		0.9, 0.3, 0.0,		//PT2
    -0.13, 0.05, 0.0,		0.3, 0.2, 0.3,		//IN2
     -0.18,0.24, 0.0, 		1.5, 1.3, 0.2,		//PT3
     0.0, 0.13, 0.0, 		0.3, 0.2, 0.3,		//IN3
     0.18, 0.24, 0.0, 		0.0, 0.9, 0.3,		//PT4
     0.15, 0.05, 0.0, 		0.3, 0.2, 0.3,		//IN4
     0.29, -0.09, 0.0, 		0.1, 0.2, 0.9,		//PT5
     0.1, -0.09, 0.0, 		0.3, 0.2, 0.3,		//IN5
     0.0, -0.3, 0.0, 		1.0, 0.0, 0.0,		//6==1
     
     //cube
     	// +x face: RED
     1.0, -1.0, -1.0, 		1.0, 0.0, 0.0,	// Node 3
     1.0,  1.0, -1.0, 		1.0, 0.0, 0.0,	// Node 2
     1.0,  1.0,  1.0, 	  1.0, 0.0, 0.0,  // Node 4
     
     1.0,  1.0,  1.0, 	  1.0, 0.1, 0.1,	// Node 4
     1.0, -1.0,  1.0, 	  1.0, 0.1, 0.1,	// Node 7
     1.0, -1.0, -1.0, 	  1.0, 0.1, 0.1,	// Node 3

		// +y face: GREEN
    -1.0,  1.0, -1.0, 	  0.0, 1.0, 0.0,	// Node 1
    -1.0,  1.0,  1.0, 	  0.0, 1.0, 0.0,	// Node 5
     1.0,  1.0,  1.0, 	  0.0, 1.0, 0.0,	// Node 4

     1.0,  1.0,  1.0, 	  0.1, 1.0, 0.1,	// Node 4
     1.0,  1.0, -1.0, 	  0.1, 1.0, 0.1,	// Node 2 
    -1.0,  1.0, -1.0, 	  0.1, 1.0, 0.1,	// Node 1

		// +z face: BLUE
    -1.0,  1.0,  1.0, 	  0.0, 0.0, 1.0,	// Node 5
    -1.0, -1.0,  1.0, 	  0.0, 0.0, 1.0,	// Node 6
     1.0, -1.0,  1.0, 	  0.0, 0.0, 1.0,	// Node 7

     1.0, -1.0,  1.0, 	  0.1, 0.1, 1.0,	// Node 7
     1.0,  1.0,  1.0, 	  0.1, 0.1, 1.0,	// Node 4
    -1.0,  1.0,  1.0,	  0.1, 0.1, 1.0,	// Node 5

		// -x face: CYAN
    -1.0, -1.0,  1.0, 	  0.0, 1.0, 1.0,	// Node 6	
    -1.0,  1.0,  1.0, 	  0.0, 1.0, 1.0,	// Node 5 
    -1.0,  1.0, -1.0, 	  0.0, 1.0, 1.0,	// Node 1
    
    -1.0,  1.0, -1.0, 	  0.1, 1.0, 1.0,	// Node 1
    -1.0, -1.0, -1.0, 	  0.1, 1.0, 1.0,	// Node 0  
    -1.0, -1.0,  1.0, 	  0.1, 1.0, 1.0,	// Node 6  
    
		// -y face: MAGENTA
     1.0, -1.0, -1.0, 	  1.0, 0.0, 1.0,	// Node 3
     1.0, -1.0,  1.0, 	  1.0, 0.0, 1.0,	// Node 7
    -1.0, -1.0,  1.0, 	  1.0, 0.0, 1.0,	// Node 6

    -1.0, -1.0,  1.0, 	  1.0, 0.1, 1.0,	// Node 6
    -1.0, -1.0, -1.0, 	  1.0, 0.1, 1.0,	// Node 0
     1.0, -1.0, -1.0, 	  1.0, 0.1, 1.0,	// Node 3

     // -z face: YELLOW
     1.0,  1.0, -1.0, 	  1.0, 1.0, 0.0,	// Node 2
     1.0, -1.0, -1.0, 	  1.0, 1.0, 0.0,	// Node 3
    -1.0, -1.0, -1.0, 	  1.0, 1.0, 0.0,	// Node 0		

    -1.0, -1.0, -1.0, 	  1.0, 1.0, 0.1,	// Node 0
    -1.0,  1.0, -1.0, 	  1.0, 1.0, 0.1,	// Node 1
     1.0,  1.0, -1.0, 	  1.0, 1.0, 0.1,	// Node 2
     
  ]);
  
  
    // Normal
  var normals = new Float32Array([
    //Flower Center
  //0.0, 0.0, 1.0,    0.22, 0.30,-0.92,   0.35, -0.12, -0.93,     0.0, 0.0, 1.0,    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  0.0, 0.0, 1.0,
    0.0, 0.0, -1.0,    0.0, -0.30, -0.92,   -0.35, -0.12, -0.93,     -0.2, 0.30, -0.90,    0.20, 0.30, -0.90,   0.35, -0.12, -0.93,  0.0, 0.0, -1.0,
  
    //Petals A
   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  0.0, 0.0, 1.0,

    //Petals B
  0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  0.0, 0.0, 1.0,
   //Petals C
  0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  
   //Star
   
    0.0,0.0, -1.0,  .55,.26,-.79,   0,-.743,-.669,   .415,-.474,-.777,   -.641,-.169,-.749,  -.351,.571,-.742,
    
    .351,.571,-.742,   .641,-.169,-.749,  -.415,-.474,-.777,   0,-.743,-.669,   -.55,.26,-.79,   -.55,.26,-.79,
    //0.0,0.0, -1.0,  .55,.26,-.79,   0,-.743,-.669,   .415,-.474,-.777,   -.641,-.169,-.749,     -.351,.571,-.742,

    //BOX
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  1.0, 0.0, 0.0,   1.0, 0.0, 0.0, // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0, // v0-v5-v6-v1 up
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,// v0-v1-v2-v3 front
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,// v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,// v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,// v4-v7-v6-v5 back
    //Grid
    
    
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
    Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
    Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   
   
    Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
    Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
    Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front
   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),   Math.random(), Math.random(), Math.random(),  // v0-v1-v2-v3 front


    
  ]);


  var n_buffer = gl.createBuffer();
  if (!n_buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  
  gl.bindBuffer(gl.ARRAY_BUFFER, n_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
  
  var n_attribute = gl.getAttribLocation(gl.program, 'a_Normal');
  if (n_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(n_attribute,3, gl.FLOAT, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(n_attribute);

  
  
  ///---

  makeGroundGrid();

  // How much space to store all the shapes in one array?
  mySiz = forestVerts.length + gndVerts.length;

  // How many vertices total?
  var nn = mySiz / floatsPerVertex;
    console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);

  // Copy all shapes into one big Float32 array:
  var verticesColors = new Float32Array(mySiz);
  // Copy them:  remember where to start for each shape:
  forestStart = 0;	// we store the forest first.
  for(i=0,j=0; j< forestVerts.length; i++,j++) {
  	verticesColors[i] = forestVerts[j];
  } 
  gndStart = i;	// next we'll store the ground-plane;
  for(j=0; j< gndVerts.length; i++, j++) {
	verticesColors[i] = gndVerts[j];
  }

  // Create a vertex buffer object (VBO)
  var vertexColorbuffer = gl.createBuffer();  
  if (!vertexColorbuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Write vertex information to buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  // Assign the buffer object to a_Position and enable the assignment
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);
  // Assign the buffer object to a_Color and enable the assignment

 var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);

  return mySiz/floatsPerVertex;	// return # of vertices
}
var col = 0;
var blah = 0;

//KEYPRESS
function keydown(ev, gl, u_ViewMatrix, viewMatrix) {
  //WALKING DIRECTIONS
    if(ev.keyCode == 39) { // The right arrow key was pressed
      if (xAng>=0) {
	lookZ += (Math.sqrt(1-(Math.sin(toRadians((90-xAng)))*Math.sin(toRadians((90-xAng))))))/5;
	g_EyeZ += (Math.sqrt(1-(Math.sin(toRadians((90-xAng)))*Math.sin(toRadians((90-xAng))))))/5;
	g_EyeX += (Math.sin(toRadians((90-xAng))))/10;
	lookX += (Math.sin(toRadians((90-xAng))))/10;
	}
      else {
	var nxAng = -xAng;
	lookX += (Math.sqrt(1-(Math.sin(toRadians((nxAng)))*Math.sin(toRadians((nxAng))))))/10;
	g_EyeX += (Math.sqrt(1-(Math.sin(toRadians((nxAng)))*Math.sin(toRadians((nxAng))))))/10;
	g_EyeZ -= (Math.sin(toRadians((nxAng))))/5;
	lookZ -= (Math.sin(toRadians((nxAng))))/5;
      }
    } else 
    if (ev.keyCode == 37) { // The left arrow key was pressed
	//lookX -= 0.1;		// INCREASED for perspective camera)
	//g_EyeX -= 0.1
	if (xAng<=0) {
	lookZ += (Math.sqrt(1-(Math.sin(toRadians((90-xAng)))*Math.sin(toRadians((90-xAng))))))/5;
	g_EyeZ += (Math.sqrt(1-(Math.sin(toRadians((90-xAng)))*Math.sin(toRadians((90-xAng))))))/5;
	
	g_EyeX -= (Math.sin(toRadians((90-xAng))))/10;
	lookX -= (Math.sin(toRadians((90-xAng))))/10;
	}
	
	else {
	var nxAng = 90-xAng;
	lookZ -= (Math.sqrt(1-(Math.sin(toRadians((nxAng)))*Math.sin(toRadians((nxAng))))))/5;
	g_EyeZ -= (Math.sqrt(1-(Math.sin(toRadians((nxAng)))*Math.sin(toRadians((nxAng))))))/5;
	
	g_EyeX -= (Math.sin(toRadians((nxAng))))/10;
	lookX -= (Math.sin(toRadians((nxAng))))/10;
	}
    }
    else 
    if (ev.keyCode == 38) { // The up arrow key was pressed
	//g_EyeZ -= 0.1;		// INCREASED for perspective camera)
	lookZ -= (Math.sqrt(1-(Math.sin(toRadians(xAng))*Math.sin(toRadians(xAng)))))/10;
	g_EyeZ -= (Math.sqrt(1-(Math.sin(toRadians(xAng))*Math.sin(toRadians(xAng)))))/10;
	g_EyeX += (Math.sin(toRadians(xAng)))/5;
	lookX += (Math.sin(toRadians(xAng)))/5;
	//console.log(xAng, g_EyeX, g_EyeZ, Math.sin(toRadians(xAng)));
	
    }
    else 
    if (ev.keyCode == 40) { // The down arrow key was pressed
	lookZ += (Math.sqrt(1-(Math.sin(toRadians(xAng))*Math.sin(toRadians(xAng)))))/10;
	g_EyeZ += (Math.sqrt(1-(Math.sin(toRadians(xAng))*Math.sin(toRadians(xAng)))))/10;
	g_EyeX -= (Math.sin(toRadians(xAng)))/5;
	lookX -= (Math.sin(toRadians(xAng)))/5;
    }
    //CAMERA CONTROL
    else 
    if (ev.keyCode == 65) { // The a key was pressed
	lookX -= 0.2;		// INCREASED for perspective camera)
	xAng--;
    }
    else 
    if (ev.keyCode == 68) { // The d key was pressed
	lookX += 0.2;
	xAng++;
	//console.log(xAng, g_EyeX, g_EyeZ, Math.sin(xAng));
    }
    else 
    if (ev.keyCode == 83) { // The s key was pressed
	lookY -= 0.2;		// INCREASED for perspective camera)
    }
    else 
    if (ev.keyCode == 87) { // The w key was pressed
	lookY += 0.2;
    }
    //MISC BUTTONS
    else 
    if (ev.keyCode == 80) { // The p key was pressed
	nPetals++;
	ax = 0;
    }
    else 
    if (ev.keyCode == 79) { // The p key was pressed
	nPetals--;
    }
    else //SPACE
    if (ev.keyCode == 32) { // Tspace
	if (lights_on){
	  lights_on = false;
	}
	else lights_on = true;
    }
    else
    if (ev.keyCode == 72) { // h
	if (headlight){
	  headlight = false;
	}
	else headlight = true;
    }
    else //SPACE
    if (ev.keyCode == 76) { // l
	if (crazy){
	  crazy = false;
	}
	else crazy = true;
    }
    else 
    if (ev.keyCode == 77) { // m
	if (materials_on){
	  materials_on = false;
	}
	else materials_on = true;
    }
    else { return; } // Prevent the unnecessary drawing
}





function draw(gl, projMatrix, u_ViewMatrix, viewMatrix, u_ProjMatrix,canvas, u_NormalMatrix, normalMatrix,
	      u_LightDiffuseColor, u_LightPosition, u_AmbientLight, u_Specular, u_HeadlightPosition,
	       u_Ks, u_Kd, u_Ka, u_Ke) {
//RESIZE
  canvas = document.getElementById('webgl');
  resizeCanvas(canvas,gl);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
//VIEWPORT
 gl.viewport(0, 0, gl.canvas.width,gl.canvas.height);
 var vpAspect = (gl.canvas.clientWidth) /(gl.canvas.clientHeight);// On-screen aspect ratio for// this camera: width/height.
 projMatrix.setPerspective(40, gl.drawingBufferWidth/gl.drawingBufferHeight, 1, 100);
gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

//CAMERA
  viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ, lookX, lookY, lookZ, 0, 1, 0);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  
//HEADLIGHT
  gl.uniform3f(u_HeadlightPosition, g_EyeX, g_EyeY, g_EyeZ);
  if (blah < 150) {
    col += 0.01;
    blah++;
  }
  else if (blah < 350){
  col -= 0.01;
  blah++;

  }
  else {
    blah = 0;
    }
//SUPER CONTROLLED LIGHT
if (lights_on) {
  gl.uniform3f(u_AmbientLight,
	        parseFloat(document.getElementById("ambientR").value),
                parseFloat(document.getElementById("ambientG").value),
                parseFloat(document.getElementById("ambientB").value)
	      );

 gl.uniform3f(u_LightDiffuseColor,
	        parseFloat(document.getElementById("directionalR").value),
                parseFloat(document.getElementById("directionalG").value),
                parseFloat(document.getElementById("directionalB").value));
  gl.uniform3f(u_LightPosition,
	        parseFloat(document.getElementById("lightDirectionX").value),
                parseFloat(document.getElementById("lightDirectionY").value),
                parseFloat(document.getElementById("lightDirectionZ").value));
  gl.uniform3f(u_Specular,
                parseFloat(document.getElementById("specularR").value),
                parseFloat(document.getElementById("specularG").value),
                parseFloat(document.getElementById("specularB").value)
            );

}


else {
  gl.uniform3f(u_AmbientLight, 0.0,0.0,0.0);
  gl.uniform3f(u_LightDiffuseColor, 0.0,0.0,0.0);
  gl.uniform3f(u_LightPosition,	 0.0,0.0,0.0);
  gl.uniform3f(u_Specular, 0.0,0.0,0.0);
}

//HEADLIGHT
gl.uniform3f(u_HeadlightPosition, g_EyeX, g_EyeY, g_EyeZ);
  // Draw the scene:
  drawMyScene(gl, projMatrix, u_ViewMatrix, viewMatrix, u_ProjMatrix, u_NormalMatrix, normalMatrix,
	       u_Ks, u_Kd, u_Ka, col, u_Ke);  
}
//DRAWS SCENE
function drawMyScene(gl, projMatrix, u_viewMatrix, viewMatrix, u_ProjMatrix, u_NormalMatrix, normalMatrix,
		      u_Ks, u_Kd, u_Ka, col, u_Ke) {

//TEST BOX
  pushMatrix(viewMatrix);
  viewMatrix.scale(0.2,0.2,0.2);
  viewMatrix.translate(-1,0.0,-12);
  viewMatrix.rotate(4*currentAngle, 1,1,0);
  gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix.elements);
 
  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  //BOX MATERIAL
   gl.uniform3f(u_Ke, 0.5, 0.8, 0.5);
   gl.uniform3f(u_Ka, 0.1, 0.1, 0.1);				// Ka ambient
   gl.uniform3f(u_Kd, Math.random(), 0, Math.random());	//diffuse
   gl.uniform3f(u_Kd, 0.6, 0.0, 0.9);	//diffuse
   gl.uniform3f(u_Ks, .6, .6, .6); //shinyness? idk 
  //END BOX MATERIAL
  gl.drawArrays(gl.TRIANGLES, 32, 36); //Box1

  viewMatrix = popMatrix();
  //END TEST BOX
  gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
  
  
  //DRAW STAR
   pushMatrix(viewMatrix);
  viewMatrix.translate(-1.0,0.3,-1.5); //move star
  viewMatrix.rotate(currentAngle*4*starSpin, 0,1,0);
  viewMatrix.scale(3,3,3);
  
  viewMatrix.translate(0.0, .3,0);
  //MOUSE DRAGG
   var dist = Math.sqrt(xMdragTot*xMdragTot + yMdragTot*yMdragTot);
  viewMatrix.rotate(dist*120.0, -yMdragTot+0.0001, xMdragTot+0.0001, 0.0);
  //////
  gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix.elements);

  
  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
 //MATERIAL A
 gl.uniform3f(u_Ka, 0.24725,  0.2245,   0.0645);				// Ka ambient
   gl.uniform3f(u_Kd,0.34615,  0.3143,   0.0903);	//diffuse
   gl.uniform3f(u_Ks, 1.797357, 1.723991, 1.208006); //shinyness? idk
   //
  gl.drawArrays(gl.TRIANGLE_FAN, 20, 12); //SIDE A
  normalMatrix = new Matrix4();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  
  
  viewMatrix.translate(0.0,-.3,0);
  viewMatrix.rotate(180,0,1,0);
  viewMatrix.rotate (-currentAngle, 1,0,0);
  viewMatrix.translate(0.0, .3,0);

  gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix.elements);
  
  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  //MATERIAL B
   gl.uniform3f(u_Ka,0.23125,  0.23125,  0.23125);				// Ka ambient
   gl.uniform3f(u_Kd,0.2775,   0.2775,   0.2775);	//diffuse
   gl.uniform3f(u_Ks, 1.773911, 1.773911, 1.773911); //shinyness? idk
  
  
  
  gl.drawArrays(gl.TRIANGLE_FAN, 20, 12); //SIDE B
  viewMatrix = popMatrix();
  //END STAR//
  
  //CUBE STACK//
  pushMatrix(viewMatrix);
  viewMatrix.translate(3.0,-0.3,-3.5);
  viewMatrix.scale(.2,.2,.2);
  gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix.elements);
  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  
     gl.uniform3f(u_Ka, 0.1, 0.1, 0.1);				// Ka ambient
   gl.uniform3f(u_Kd, 0.6, 0.0, 0.0);	//diffuse
   gl.uniform3f(u_Ks, .9, .6, .6); //shinyness? idk
   
   
  gl.drawArrays(gl.TRIANGLES, 32, 36); //Box1
  
  viewMatrix.translate(-1.0,0.7,0);
  viewMatrix.rotate(-45,0,1,0);
  viewMatrix.rotate(0.25*currentAngle,0,0,1);
  viewMatrix.translate(1.0,+1.0,0.00);
  viewMatrix.scale(.8,.8,.8);
  gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix.elements);
  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
   gl.uniform3f(u_Kd, 0.6, 0.8, 0.0);	//diffuse
  gl.drawArrays(gl.TRIANGLES, 32, 36); //Box2
  
  viewMatrix.translate(1.0,0.7,0);
  viewMatrix.rotate(180,0,1,0);
  viewMatrix.rotate(currentAngle,0,0,1);
  viewMatrix.translate(1.0,+1.0,0.00);
  viewMatrix.scale(.8,.8,.8);
  gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix.elements);
  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
   gl.uniform3f(u_Kd, 0.0, 0.3, 0.2);	//diffuse
  gl.drawArrays(gl.TRIANGLES, 32, 36); //Box3
  
  viewMatrix.translate(-1.0,0.8,0);
  viewMatrix.rotate(35,0,1,0);
  viewMatrix.rotate(90,1,0,0);
  viewMatrix.rotate(0.4*currentAngle,-1,0,0);
  viewMatrix.translate(1.0,0.0,-1.0);
  
  viewMatrix.scale(.8,.8,.8);
  gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix.elements);
  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
   gl.uniform3f(u_Kd, 0.6, 0.2, 0.1);	//diffuse
  gl.drawArrays(gl.TRIANGLES, 32, 36); //Box4
  viewMatrix = popMatrix();
  //END STACK//
  
  
  
  //DRAW GRID
  pushMatrix(viewMatrix);
  viewMatrix.rotate(-90.0, 1,0,0);	// new one has "+z points upwards",
  viewMatrix.translate(0.0, 0.0, -0.6);	
  viewMatrix.scale(0.4, 0.4,0.4);		// shrink the drawing axes //for nicer-looking ground-plane, and
  gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix.elements);

  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

     gl.uniform3f(u_Ka,col,  0.4,  1);				// Ka ambient
   gl.uniform3f(u_Kd,col*2+0.01,  col-.02,  col+0.01);	//diffuse
   gl.uniform3f(u_Ks, 1, 0, 1); //shinyness? idk
  gl.drawArrays(gl.TRIANGLE_STRIP,							// use this drawing primitive, and
  	gndStart/floatsPerVertex,	// start at this vertex number, and
  	(gndVerts.length/floatsPerVertex)/2);		// draw this many vertices
 
  gl.drawArrays(gl.LINES,							// use this drawing primitive, and
  	//gndStart/floatsPerVertex,	// start at this vertex number, and
  	264,
	(gndVerts.length/floatsPerVertex)/2);		// draw this many vertices
	
  viewMatrix = popMatrix();
  //END GRID
  
 //DRAW FLOWER
 //Flower rotation speed variables
  var aSpeed1=[1, -.075, .67, .38, -.6, 1, -.075, .67, .38, -.6, .7, .33, -.087, .048, -1.0, 1, -.075, .67, .38, -.6];
  var aSpeed2=[.7, .33, -.087, .048, -1.0, 1, -.075, .67, .38, -.6, .4, -.9, .87, .058, -.7, .7, .33, -.087, .048, -1.0];
  var aSpeed3=[.4, -.9, .87, .058, -.7, .7, .33, -.087, .048, -1.0, 1, -.075, .67, .38, -.6, 1, -.075, .67, .38, -.6, .7];
  

 //CENTER OF FLOWER
  viewMatrix.translate(1.0,0.4,-2.5);
  viewMatrix.rotate(currentAngle*4+30,1,-1,0);
  gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix.elements);
  
  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  
     gl.uniform3f(u_Ka,0.2, 0.05, 0.05);				// Ka ambient
   gl.uniform3f(u_Kd,0.1, 0.05, 0.05);	//diffuse
   gl.uniform3f(u_Ks, 0.01, 0.01, 0.02); //shinyness? idk
   
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 7); //Center
  
  gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix.elements);
  viewMatrix.rotate(180,0,1,0);
  gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix.elements);
  
  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniform3f(u_Ka,0.0, 0.0, 0.0);				// Ka ambient
   gl.uniform3f(u_Kd,0.0, 0.0, 0.0);	//diffuse
   gl.uniform3f(u_Ks, 0.01, 0.01, 0.02); //shinyness? idk
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 7); //Center2
  
  
  //PETALS
  gl.uniform3f(u_Ka,0.9, 0.3, 0.3);				// Ka ambient
   gl.uniform3f(u_Ks, 0.03, 0.01, 0.02); //shinyness? idk
  var j = 0
  for (var i = 0;i<nPetals;i++) {
    if (j>=19) {
      j = 0;
    }
    viewMatrix.rotate(360/nPetals,0,0,1);
    pushMatrix(viewMatrix);
     
    viewMatrix.translate(0,0.20,0);
    viewMatrix.rotate(currentAngle*aSpeed1[j],1,0,0);
  
    gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix.elements);
    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
     gl.uniform3f(u_Kd,.96, 0.23, 0.22  );	//diffuse
    gl.drawArrays(gl.TRIANGLE_STRIP, 7, 5); //petal part a
    
    viewMatrix.translate(0,0.3,0);
    viewMatrix.rotate(aSpeed2[j]*currentAngle,1,0,0); //middle rotation
    gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix.elements);
    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
     gl.uniform3f(u_Kd, .99, 0.60, 0.10  );	//diffuse
    gl.drawArrays(gl.TRIANGLE_STRIP, 12, 5); //petal b
    
    viewMatrix.translate(0,0.3,0);
    viewMatrix.rotate(aSpeed3[j]*currentAngle,1,0,0); 
    gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix.elements);
    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
     gl.uniform3f(u_Kd, 0.9, 0.9, 0.2 );	//diffuse
    gl.drawArrays(gl.TRIANGLES, 17, 3); //petal c
   
    

    viewMatrix = popMatrix();
    j++;
     
  }


 


}

var g_last = Date.now();
function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  if(angle >   75.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
  if(angle <  0.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}


function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
  var x = (xp - canvas.width/2)  / (canvas.width/2);			// normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /(canvas.height/2);
  isDrag = true;											// set our mouse-dragging flag
  xMclik = x;													// record where mouse-dragging began
  yMclik = y;
};


function myMouseMove(ev, gl, canvas) {
  if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
  var x = (xp - canvas.width/2)  /(canvas.width/2);			// normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /(canvas.height/2);
  xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
  yMdragTot += (y - yMclik);
  xMclik = x;													// Make next drag-measurement from here.
  yMclik = y;
};

function myMouseUp(ev, gl, canvas) {

  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
  var x = (xp - canvas.width/2)  /  (canvas.width/2);			// normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /(canvas.height/2);
  console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
  isDrag = false;											// CLEAR our mouse-dragging flag, and
  xMdragTot += (x - xMclik);
  yMdragTot += (y - yMclik);
  console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
};

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

function resizeCanvas(canvas, gl) {
  var width = canvas.clientWidth;
   var height = canvas.clientHeight;
   if (canvas.width != width ||
       canvas.height != height) {
     // Change the size of the canvas to match the size it's being displayed
     canvas.width = width;
     canvas.height = height;
   }
}


function initArrayBuffer(gl, attribute, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}