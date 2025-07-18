import * as THREE from 'three';

// 全局变量
let uniforms = {
    u_time: { value: 0.0 }
};
let clock = new THREE.Clock();
let timerFlyCurve = setInterval(() => {
    const elapsed = clock.getElapsedTime();
    uniforms.u_time.value = elapsed;
}, 20);

// 着色器设置
const vertexShader = `
    varying vec2 vUv;
    attribute float percent;
    uniform float u_time;
    uniform float number;
    uniform float speed;
    uniform float length;
    varying float opacity;
    uniform float size;
    void main() {
       vUv = uv;
       vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
       float l = clamp(1.0-length,0.0,1.0);
       gl_PointSize = clamp(fract(percent*number + l - u_time*number*speed)-l ,0.0,1.) * size * (1./length);
       opacity = gl_PointSize/size;
       gl_Position = projectionMatrix * mvPosition;
   }
`;

const fragmentShader = `
    #ifdef GL_ES
        precision mediump float;
    #endif
    varying float opacity;
    uniform vec3 color;
    void main(){
       if(opacity <=0.2){
           discard;
       }
        gl_FragColor = vec4(color,1.0);
    }
`;

export function createFlyCurve(points, closed, color = new THREE.Color(0x3f72af), speed = 0.01, length = 0.1, size = 3) {
    var curve = new THREE.CatmullRomCurve3(points, closed);
    var flyLine = initFlyLine(curve, {
        speed: speed,
        color: color,
        number: 1, // 同时跑动的流光数量
        length: length, // 流光线条长度
        size: size // 粗细
    }, 5000);
    return flyLine;
}

function initFlyLine(curve, matSetting, pointsNumber) {
    var points = curve.getPoints(pointsNumber);
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    const length = points.length;
    var percents = new Float32Array(length);
    for (let i = 0; i < points.length; i += 1) {
        percents[i] = (i / length);
    }
    geometry.setAttribute('percent', new THREE.BufferAttribute(percents, 1));
    const lineMaterial = initLineMaterial(matSetting);
    var flyLine = new THREE.Points(geometry, lineMaterial);
    return flyLine;
}

function initLineMaterial(setting) {
    const number = setting ? (Number(setting.number) || 1.0) : 1.0;
    const speed = setting ? (Number(setting.speed) || 1.0) : 1.0;
    const length = setting ? (Number(setting.length) || 0.5) : 0.5;
    const size = setting ? (Number(setting.size) || 3.0) : 3.0;
    const color = setting ? setting.color || new THREE.Vector3(0, 1, 1) : new THREE.Vector3(0, 1, 1);
    const singleUniforms = {
        u_time: uniforms.u_time,
        number: { type: 'f', value: number },
        speed: { type: 'f', value: speed },
        length: { type: 'f', value: length },
        size: { type: 'f', value: size },
        color: { type: 'v3', value: color }
    };
    const lineMaterial = new THREE.ShaderMaterial({
        uniforms: singleUniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true
    });
    return lineMaterial;
}

export default {
    createFlyCurve,
    timerFlyCurve
}
