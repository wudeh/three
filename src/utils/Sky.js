import { sk } from 'element-plus/es/locales.mjs';
import * as THREE from 'three';
import { Sky } from "three/examples/jsm/objects/Sky";
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

let sky = null;

/**
 * 添加天空盒
 * @param {THREE.Scene} scene 场景
 * @param {THREE.WebGLRenderer} renderer 渲染器
 * @param {string} sky 天空类型，'sun' 'qingtian'  'yewan' 'lantian'; 'none' 清除天空盒
 * */
export default function addSky(scene, renderer, skyType = 'sun') {
    if(skyType === 'none') {
        // 清除天空盒
        if(sky) {
            scene.remove(sky);
            sky = null;
        }
        // 清除天空盒图片
        scene.children.forEach(child => {
            if(child.type === 'Sky') {
                scene.remove(child);
            }
        });
        return;
    }
  // 默认使用 THREE 自带的天空实现太阳
    if(skyType === 'sun'){
        sky = new Sky();
        sky.scale.setScalar( 45000 );//太阳盒子的大小，要把整个场景包含进去
        scene.add( sky );

        const effectController = {
            turbidity: 2,//浑浊度
            rayleigh: 8,//阳光散射，黄昏效果的程度
            mieCoefficient: 0.001,//太阳对比度，清晰度
            mieDirectionalG: 0.7,
            elevation: 4,//太阳高度
            azimuth: 150,//太阳水平方向位置
            exposure: renderer.toneMappingExposure //光线昏暗程度
        };

        let sun = new THREE.Vector3();
        const uniforms = sky.material.uniforms;
        uniforms[ 'turbidity' ].value = effectController.turbidity;
        uniforms[ 'rayleigh' ].value = effectController.rayleigh;
        uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
        uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;
        const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
        const theta = THREE.MathUtils.degToRad( effectController.azimuth );
        sun.setFromSphericalCoords( 3, phi, theta );
        uniforms[ 'sunPosition' ].value.copy( sun );
        return;
    }
    // 清除之前的天空盒
    if(sky) {
        if(sky.dispose) sky.dispose();
    }

    scene.remove(sky)
    sky = null;
    // 蓝天，晴天，夜晚天空盒子
    let url = [
      `./groundSkyBox/${skyType}/right.jpg`,
      `./groundSkyBox/${skyType}/left.jpg`,
      `./groundSkyBox/${skyType}/top.jpg`,
      `./groundSkyBox/${skyType}/bottom.jpg`,
      `./groundSkyBox/${skyType}/front.jpg`,
      `./groundSkyBox/${skyType}/back.jpg`
    ];
    const texture = new THREE.CubeTextureLoader()
    .load(url)
     scene.background = texture

    // const texture = new THREE.CubeTextureLoader()
    // .load([
    //   './groundSkyBox/yewan/negx.jpg',
    //   './groundSkyBox/yewan/negz.jpg',
    //   './groundSkyBox/yewan/posy.jpg',
    //   './groundSkyBox/yewan/negy.jpg',
    //   './groundSkyBox/yewan/posx.jpg',
    //   './groundSkyBox/yewan/posz.jpg',
    // ])
    //  scene.background = texture

}