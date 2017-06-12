/* constant values */

const E = {
    x: .5,
    y: .5,
    z: -.5
};
//const viewWindow = {ul: {x: 0,y: 1,z: 0},ll: {x: 0,y: 1,z: 0},ur: {x: 1,y: 1,z: 0},lr: {x: 1,y: 1,z: 0}}
const lights = [{
    location: {
        x: 1,
        y: 1,
        z: -2
    },
    ambient: [1, 1, 1],
    diffuse: [1, 1, 1],
    specular: [1, 1, 1]
}];

var nFactor = 15;
var calcLighting = true;
/* classes */

// Color constructor
class Color {
    constructor(r, g, b, a) {
        try {
            if ((typeof (r) !== 'number') || (typeof (g) !== 'number') || (typeof (b) !== 'number') || (typeof (a) !== 'number'))
                throw 'color component not a number'
            else if ((r < 0) || (g < 0) || (b < 0) || (a < 0))
                throw 'color component less than 0'
            else if ((r > 255) || (g > 255) || (b > 255) || (a > 255))
                throw 'color component bigger than 255'
            else {
                this.r = r
                this.g = g
                this.b = b
                this.a = a
            }
        } // end try
        catch (e) {
            console.log(e)
        }
    } // end Color constructor

    // Color change method
    change(r, g, b, a) {
        try {
            if ((typeof (r) !== 'number') || (typeof (g) !== 'number') || (typeof (b) !== 'number') || (typeof (a) !== 'number'))
                throw 'color component not a number'
            else if ((r < 0) || (g < 0) || (b < 0) || (a < 0))
                throw 'color component less than 0'
            else if ((r > 255) || (g > 255) || (b > 255) || (a > 255))
                throw 'color component bigger than 255'
            else {
                this.r = r
                this.g = g
                this.b = b
                this.a = a
            }
        } // end throw
        catch (e) {
            console.log(e)
        }
    } // end Color change method
} // end color class

/* utility functions */

//Math Functions that can be performed on Vecors
const vm = {
    dot: function (v1, v2) {
        if (v1 == undefined || v2 == undefined) throw "undefined Vector";
        if (v1.x != undefined) return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
        else {
            //Not a direction vector, have to do it dynamically
            var v = 0;
            for (var i = 0; i < Math.min(v1.length, v2.length); i++)
                v += v1[i] * v2[i];
            return v;
        }
    },
    mag: function (v) {
        if (v.x != undefined) {
            return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        } else {
            var v = 0;
            for (var i = 0; i < v.length; i++)
                v += v[i] * v[i];
            return Math.sqrt(v);
        }
    },
    sub: function (v1, v2) {
        if (v1.x != undefined) return {
            x: v1.x - v2.x,
            y: v1.y - v2.y,
            z: v1.z - v2.z
        };
        else {
            var v = [];
            for (var i = 0; i < Math.min(v1.length, v2.length); i++)
                v[i] = v1[i] - v2[i];
            return v;
        }
    },
    add: function (v1, v2) {
        if (v1.x != undefined) return {
            x: v1.x + v2.x,
            y: v1.y + v2.y,
            z: v1.z + v2.z
        };
        else {
            var v = [];
            for (var i = 0; i < Math.min(v1.length, v2.length); i++)
                v[i] = v1[i] + v2[i];
            return v;
        }
    },
    xScal: function (v, s) {
        if (v.x != undefined) return {
            x: v.x * s,
            y: v.y * s,
            z: v.z * s
        };
        else {
            var vx = [];
            for (var i = 0; i < v.length; i++)
                vx[i] = v[i] * s;
            return vx;
        }
    },
    norm: function (v) {
        if (v.x != undefined) {
            const m = 1 / this.mag(v);
            return normV = {
                x: v.x * m,
                y: v.y * m,
                z: v.z * m
            };
        } else {
            var vx = [],
                mag = 1 / this.mag(v);
            for (var i = 0; i < v.length; i++) vx[i] = v[i] * mag;
            return vx;
        }
    }
}

// draw a pixel at x,y using color
function drawPixel(imagedata, x, y, color) {
    try {
        if ((typeof (x) !== 'number') || (typeof (y) !== 'number'))
            throw 'drawpixel location not a number'
        else if ((x < 0) || (y < 0) || (x >= imagedata.width) || (y >= imagedata.height))
            throw 'drawpixel location outside of image'
        else if (color instanceof Color) {
            var pixelindex = (y * imagedata.width + x) * 4
            imagedata.data[pixelindex] = color.r
            imagedata.data[pixelindex + 1] = color.g
            imagedata.data[pixelindex + 2] = color.b
            imagedata.data[pixelindex + 3] = color.a
        } else
            throw 'drawpixel color is not a Color'
    } // end try
    catch (e) {
        console.log(e)
    }
} // end drawPixel

// get the input spheres from the standard class URL
function getInputSpheres(complete) {
    $.get('./spheres.json', function (data) {
        if (typeof complete === 'function') complete(data);
    });
} // end get input spheres

var pixels = [];
var doLog = true;
/**
 * Draws the circles using ray tracing
 * 
 * calcLight parameter, if set to true, will determine the color based on the lights in the environment
 */
function drawAllPixels(context, calcLight) {
    nFactor = (nFactor % 2 == 0) ? nFactor + 1 : nFactor;
    getInputSpheres(function (inputSpheres) {
        const dim = context.canvas.width;
        doLog = true;
        //Scaled Value of dim to test runtime
        const dinv = 1 / dim;
        var c = new Color(0, 0, 0, 255);
        var imagedata = context.createImageData(dim, dim);
        const startTime = new Date().getTime();
        var n = 0,
            f = 0;
        for (var x = 0; x < dim; x++) {
            for (var y = 0; y < dim; y++) {
                //n++;
                pixels[x] = [];
                const pixel = {
                    x: x * dinv,
                    y: 1 - (y * dinv),
                    z: 0
                };
                inputSpheres.forEach(function (cir) {
                    const calc = {
                        x: x,
                        y: y,
                        circle: cir,
                        r: cir.r,
                        C: {
                            x: cir.x,
                            y: cir.y,
                            z: cir.z
                        },
                        P: pixel
                    }
                    calc.D = vm.sub(calc.P, E);
                    calc.e_min_c = vm.sub(E, calc.C);
                    calc.a = vm.dot(calc.D, calc.D);
                    calc.b = 2 * vm.dot(calc.D, calc.e_min_c);
                    calc.c = vm.dot(calc.e_min_c, calc.e_min_c) - calc.r * calc.r;
                    calc.dis = calc.b * calc.b - 4 * calc.a * calc.c;
                    if (calc.dis >= 0) {
                        //Calculate the value of t at this intersection
                        var t = quadForm(calc.a, calc.b, calc.c);
                        //Discard anything where t is less than 1
                        if (t <= 1) return; /*|| (typeof pixels[x][y] != 'undefined' && pixels[x][y].t > t)*/
                        /*pixels[x][y] = {
                            t: t
                        };*/
                        calc.inter = vm.add(E, vm.xScal(calc.D, t));
                        if (calcLight) {
                            //Use the lights to calculate the lighting

                            // For each light, trace from the center of the light to this point
                            const light = lights[0];
                            const I = {
                                val: [0, 0, 0],
                                La: light.ambient,
                                Ld: light.diffuse,
                                Ls: light.specular,
                                Ka: cir.ambient,
                                Kd: cir.diffuse,
                                Ks: cir.specular
                            };
                            /* N = Vector Normal to the surface */
                            I.nNorm = vm.norm(vm.sub(calc.C, calc.inter));
                            /*L = Vector From the Surface to the light source */
                            I.lNorm = vm.norm(vm.sub(calc.inter, light.location));
                            //R = 2N(N*L)-L
                            I.R = vm.sub(vm.xScal(I.nNorm, 2 * vm.dot(I.nNorm, I.lNorm)), I.lNorm);
                            /* V = Vector from the Surface to the eye */
                            I.V = vm.norm(vm.sub(calc.inter, E));
                            I.n = cir.n * nFactor;
                            I.n_dot_l = vm.dot(I.nNorm, I.lNorm);
                            [0, 1, 2].forEach(function (a) {
                                I.val[a] += Math.max((I.La[a] * I.Ka[a]), 0) +
                                    Math.max(I.Ld[a] * I.Kd[a] * I.n_dot_l, 0) +
                                    Math.max(I.Ls[a] * I.Ks[a] * Math.pow(vm.dot(vm.norm(I.R), I.V), I.n), 0);
                            });
                            c.change(255 * I.val[0], 255 * I.val[1], 255 * I.val[2], 255);
                            /**
                            if (doLog) {
                                console.log(I);
                                console.log(typeof nFactor);
                                doLog = false;
                            } /* Don't Really need this at the moment */
                            drawPixel(imagedata, x, y, c);
                        } else {
                            c.change(cir.diffuse[0] * 255, cir.diffuse[1] * 255, cir.diffuse[2] * 255, 255);
                            drawPixel(imagedata, x, y, c);
                        }
                    }
                });
            }
        }
        document.getElementById('viewport').getContext('2d').putImageData(imagedata, 0, 0);
        console.log('Draw in ' + (new Date().getTime() - startTime).toString() + ' milliseconds');
        // console.log('O(' + n + ')');
    });
}

function quadForm(a, b, c) {
    const b2 = b * b,
        a2 = a + a,
        b_ = (0 - b);
    const s = Math.sqrt(b2 - 4 * a * c);
    return Math.min((b_ + s) / (a2), (b_ - s) / a2);
}

function updateN() {
    nFactor = parseFloat(document.getElementById('nVal').value);
    console.log("UpdateN");
    draw();
}

function updateLights() {
    ['x', 'y', 'z'].forEach(function (v) {
        lights[0].location[v] = parseFloat(document.getElementById('light' + v.toUpperCase()).value);
    });
    draw();
}

function toggle3D() {
    calcLighting = document.getElementById('calcLighting').checked;
    draw();
}
/* main -- here is where execution begins after window load */

function draw() {
    var canvas = document.getElementById('viewport');
    var dim = Math.min(document.documentElement.clientWidth, document.documentElement.clientHeight) // * .9;
    canvas.width = dim;
    canvas.height = dim;
    var context = canvas.getContext('2d');
    drawAllPixels(context, calcLighting);
}

function main() {
    document.getElementById('nVal').value = nFactor;
    ['x', 'y', 'z'].forEach(function (v) {
        document.getElementById('light' + v.toUpperCase()).value = lights[0].location[v];
    });
    document.getElementById('calcLighting').checked = calcLighting;
    setTimeout(draw, 200);
}