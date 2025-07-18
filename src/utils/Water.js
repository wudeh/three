import * as THREE from 'three'
import { Water } from 'three/examples/jsm/objects/Water'

// 水面效果
export default class Water1 {

    scene;
    water;
    position;

    constructor(scene, position) {
        this.scene = scene;
        this.position = position;
        this.addWater(scene, position);
    }

    addWater(scene, position) {
        // 4. 添加环境光或太阳光
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(0, 50, 50);
        // scene.add(light);
        // 5. 加载水面法线贴图（此处仅作演示，需替换为你自己的纹理路径）
        const textureLoader = new THREE.TextureLoader();
        const waterNormals = textureLoader.load('img/waternormals.jpeg', function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // 让法线贴图可以重复
        });

        // 6. 创建水面
        const waterGeometry = new THREE.PlaneGeometry(10000, 10000); // 创建一个平面几何体作为水面

        // 7. 使用 Water 类
        const water = new Water(waterGeometry, {
            textureWidth: 512,                 // 生成的反射/折射纹理宽度
            textureHeight: 512,                // 生成的反射/折射纹理高度
            waterNormals: waterNormals,        // 法线贴图
            // alpha: 1.0,                        // 水面的透明度
            // sunDirection: light.position.clone().normalize(), // 模拟光线方向
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,                // “太阳光”颜色
            // waterColor: 0x001e0f,              // 水体颜色
            waterColor: 0x000301,              // 水体颜色
            distortionScale: 3.7,              // 失真程度，决定波纹起伏的大小
            fog: scene.fog !== undefined       // 是否结合场景雾效
        });

        water.rotation.x = - Math.PI / 2;  // 让水面水平
        if(position) {
            water.position.set(position.x, position.y, position.z);
        }
        this.water = water;

        scene.add(water);

        // 8. 动画循环
        this._animate();

    }

    _animate() {
        if (this.water) {
            requestAnimationFrame(this._animate.bind(this));

            // 让水面波纹动起来，内部水面材质会根据 time 进行偏移
            // this.water.material.uniforms['time'].value += 0.01;
            this.water.material.uniforms["time"].value += 0.04;
            // renderer.render(scene, camera);
        }
    }

    getWater() {
        return this.water;
    }
    
    setPosition(position) {
        if (this.water) {
            this.water.position.set(position.x, position.y, position.z);
        }
    }

    destroy() {
        if (this.water) {
            this.scene.remove(this.water);
            this.water.geometry.dispose();
            this.water.material.dispose();
            this.water = null;
        }
    }
    
} 

