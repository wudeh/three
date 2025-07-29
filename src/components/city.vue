<template>
    <div class="map" ref="conatinerRef"></div>
</template>

<script setup>
import * as THREE from "three"
import { OrbitControls } from 'three/examples/jsm/controls/orbitControls.js'
import { onMounted, ref, useTemplateRef } from "vue";
//导入tween 补间动画
import { Tween, Group } from "three/examples/jsm/libs/tween.module.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// 导入hdr加载器
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
// 导入DRACO解码器，解码压缩的模型
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
//导入GUI
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// 引入渲染器通道RenderPass
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
// 引入OutlinePass通道
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import addSky from "../utils/Sky";
import Cloud from "../utils/Cloud";
import Water1 from "../utils/Water"


const conatinerRef = useTemplateRef('conatinerRef')

const init = () => {
    const container = conatinerRef.value;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // 启用渲染器的阴影
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 使用柔和的阴影效果，可选PCFShadowMap、PCFSoftShadowMap等
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(50, 50, 50);
    camera.lookAt(new THREE.Vector3(0, 0, 0));


    // 平行直射光，默认指向原点（0，0，0）
    // const directionalLight = new THREE.DirectionalLight(0xEDD9CC, 1);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.intensity = 0; // 设置光强度
    directionalLight.position.set(5, 5, -5); // 设置光源的位置
    directionalLight.castShadow = true;  // 启用光源的阴影投射
    // 设置阴影贴图的分辨率，越高越好，必须是 2 的幂
    directionalLight.shadow.mapSize.set(2048, 2048)
    scene.add(directionalLight);
    scene.add(new THREE.CameraHelper(directionalLight.shadow.camera))
    // 设置三维场景计算阴影的范围
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;

    // 创建聚光灯照亮特定区域
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(5, 5, -5);
    spotLight.intensity = 0; // 设置光强度
    spotLight.castShadow = true;  // 启用光源的阴影投射
    // spotLight.target = someObject; // someObject为需要照亮的物体，聚光灯会指向这个目标
    scene.add(spotLight);

    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    ambientLight.intensity = 0.5; // 设置环境光强度
    scene.add(ambientLight);

    // 点光
    var pointLight = new THREE.PointLight(new THREE.Color().setRGB(209,166,204), 1);
    pointLight.position.set(5, 7, -7);
    pointLight.castShadow = true;  // 启用光源的阴影投射
    pointLight.intensity = 0;  // 启用光源的阴影投射
    pointLight.distance = 26;  // 启用光源的阴影投射
    scene.add(pointLight);

    // 矩形光
    const rectLight = new THREE.RectAreaLight(0xffffff, 4, 50, 50); 
    scene.add(rectLight);
    
    // 加载hdr环境图
    const rgbeLoader = new RGBELoader();
    // rgbeLoader.loadAsync("/hdr/horn-koppe_spring_4k.hdr").then((texture) => {
    // rgbeLoader.loadAsync("/hdr/satara_night_no_lamps_1k.hdr").then((texture) => {
    //     texture.mapping = THREE.EquirectangularReflectionMapping; // 设置映射类型
    //     scene.background = texture; // 设置背景
    //     scene.environment = texture; // 设置环境贴图
    // });
    // 添加水面
    // new Water1(scene, {x: 0, y: 0.19, z: 0})

    //实例化一个gui对象
    const gui = new GUI()
    gui.domElement.style.width = "300px";
    const pointLightGui = gui.addFolder("点光");
    // // folder.add(控制对象，对象具体属性，属性参数最小值，属性参数最大值)
    // pointLightGui.add(pointLight.position, 'x').min(-30).max(30).step(1).name("点光x");
    // pointLightGui.add(pointLight.position, 'y').min(-30).max(30).step(1).name("点光y");
    // pointLightGui.add(pointLight.position, 'z').min(-30).max(30).step(1).name("点光z");
    // pointLightGui.add(spotLight.position, 'x').min(-30).max(30).step(1).name("聚光灯x");
    // pointLightGui.add(spotLight.position, 'y').min(-30).max(30).step(1).name("聚光灯y");
    // pointLightGui.add(spotLight.position, 'z').min(-30).max(30).step(1).name("聚光灯z");
    // pointLightGui.add(directionalLight.position, 'x').min(-30).max(30).step(1).name("直射光x");
    // pointLightGui.add(directionalLight.position, 'y').min(-30).max(30).step(1).name("直射光y");
    // pointLightGui.add(directionalLight.position, 'z').min(-30).max(30).step(1).name("直射光z");
    // // pointLightGui.add(pointLight.position, 'z').min(-30).max(30).step(1).name("z");
    pointLightGui.add(pointLight, 'intensity').min(0).max(30).step(0.1).name("点灯光强度");
    // // pointLightGui.add(pointLight, 'distance').min(0).max(30).step(0.1).name("点灯光距离");
    pointLightGui.add(ambientLight, 'intensity').min(0).max(30).step(0.1).name("环境光强度");
    pointLightGui.add(directionalLight, 'intensity').min(0).max(30).step(1).name("直射光强度");
    pointLightGui.add(rectLight, 'intensity').min(0).max(30).step(1).name("直射矩形光强度");
    pointLightGui.add(rectLight.position, 'x').min(-300).max(300).step(1).name("矩形灯x");
    pointLightGui.add(rectLight.position, 'y').min(-300).max(300).step(1).name("矩形灯y");
    pointLightGui.add(rectLight.position, 'z').min(-300).max(300).step(1).name("矩形灯z");
    // pointLightGui.add(directionalLight.shadow.camera, 'left').min(0).max(3000).step(1).name("直射光left");
    // pointLightGui.add(directionalLight.shadow.camera, 'top').min(0).max(3000).step(1).name("直射光top");
    // pointLightGui.add(directionalLight.shadow.camera, 'right').min(0).max(3000).step(1).name("right");
    // pointLightGui.add(directionalLight.shadow.camera, 'bottom').min(0).max(3000).step(1).name("bottom");
    // pointLightGui.add(directionalLight.shadow.camera, 'near').min(0).max(3000).step(1).name("near");
    // pointLightGui.add(directionalLight.shadow.camera, 'far').min(0).max(3000).step(1).name("far");
    // pointLightGui.add(spotLight, 'intensity').min(0).max(6000).step(0.2).name("聚光灯强度");
    // // 坐标轴 辅助
    var axes = new THREE.AxesHelper(700)
    scene.add(axes)

    // 创建后处理对象EffectComposer，WebGL渲染器作为参数
    const composer = new EffectComposer(renderer);
    // 创建一个渲染器通道，场景和相机作为参数
    const renderPass = new RenderPass(scene, camera);
    // 设置renderPass通道
    composer.addPass(renderPass);
    // OutlinePass第一个参数v2的尺寸和canvas画布保持一致
    const v2 = new THREE.Vector2(window.innerWidth, window.innerHeight);
    // const v2 = new THREE.Vector2(800, 600);
    const outlinePass = new OutlinePass(v2, scene, camera);
    // 设置OutlinePass对象的可见边缘颜色为黄色
    outlinePass.visibleEdgeColor.set('yellow')
    // 设置OutlinePass对象的边缘厚度为4
    outlinePass.edgeThickness = 4;
    // 设置OutlinePass对象的边缘强度为10
    outlinePass.edgeStrength = 10;
    // 设置OutlinePass对象的脉冲周期为2
    outlinePass.pulsePeriod = 2; 
    // 设置OutlinePass通道
    composer.addPass(outlinePass);


    // 设置辉光
    const params = {
        // Bloom
        bloomStrength: 1, // 辉光强度
        bloomRadius: 0.3,
        bloomThreshold: 0.7,
        // Lighting
        lightIntensity: 1.0,
    };
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight), 
        params.bloomStrength, 
        params.bloomRadius, 
        params.bloomThreshold
    );
    pointLightGui.add(bloomPass, 'strength').min(0).max(30).step(0.1).name("辉光强度");
    composer.addPass(bloomPass);
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // 创建地板
    const bottomFloor = new THREE.PlaneGeometry(10000, 10000); // 创建一个平面几何体作为地面
    const textureMap = new THREE.TextureLoader().load('/img/floorImg.png');
    textureMap.wrapS = THREE.RepeatWrapping; // 在U方向（水平）平铺
    textureMap.wrapT = THREE.RepeatWrapping;// 在V方向（垂直）平铺
    textureMap.repeat.set(4000, 4000);// 数字越小贴图越大
    const topFaceMaterial = new THREE.MeshPhysicalMaterial({
        map: textureMap,
        transparent: true
    });

    const mesh = new THREE.Mesh(bottomFloor, topFaceMaterial);
    mesh.rotation.x = -Math.PI / 180 * 90
    mesh.castShadow = true;  // 启用物体的阴影投射
    mesh.receiveShadow = true;  // 启用物体接收阴影
    scene.add(mesh);

    // 创建窗户
    const windowLight = new THREE.PlaneGeometry(10, 10); // 创建一个平面几何体作为地面
    const windowLightMaterial = new THREE.MeshPhysicalMaterial({
        color: "#ffffff"
    });
    const windowLightMesh = new THREE.Mesh(windowLight, windowLightMaterial)
    // windowLightMesh.add(rectLight)
    // scene.add(windowLightMesh);
    pointLightGui.add(windowLightMesh.position, 'x').min(-300).max(300).step(1).name("窗户灯x");
    pointLightGui.add(windowLightMesh.position, 'y').min(-300).max(300).step(1).name("窗户灯y");
    pointLightGui.add(windowLightMesh.position, 'z').min(-300).max(300).step(1).name("窗户灯z");

    const controls = new OrbitControls(camera, renderer.domElement);
    // 限制垂直旋转角度
    controls.minPolarAngle = Math.PI / 4; // 45度
    controls.maxPolarAngle = Math.PI / 2.5; // 限制最大仰角
    function render() {
        renderer.render(scene,camera);//执行渲染操作
        // 渲染外发光通道
        composer.render();

        controls.update();//更新控制器
        requestAnimationFrame(render);//请求再次执行渲染函数render
    }
    render();

    // 添加天空
    // addSky(scene, renderer, 'sun')
    // Cloud(scene,camera,renderer)
    // 绘制球体
    const skyGeo = new THREE.SphereGeometry(1000, 600, 600);
    // 添加天空材质
    const skyTex = new THREE.TextureLoader().load("/images/sky.jpg")
    const skyMat = new THREE.MeshBasicMaterial({
    map: skyTex
    })
    // 视角进入球体内部
    skyGeo.scale(1, 1, -1)
    // 几何体+材质形成一个场景
    const sky = new THREE.Mesh(skyGeo, skyMat)
    // scene.add(sky)
    const video = document.createElement('video')
    video.src = '/img/sky_video.mp4'
    video.loop = true
    video.play()
    const texture = new THREE.VideoTexture(video)
    skyMat.map = texture
    skyMat.map.needsUpdate = true

    // 初始化加载器
    const building = new THREE.Object3D();
    const loader = new GLTFLoader();
    // 实例化加载解析器-加载压缩的模型
    const dracoLoader = new DRACOLoader();
    // 设置draco路径
    dracoLoader.setDecoderPath('./moduler/draco/');
    // 设置解码器类型
    dracoLoader.setDecoderConfig({ type: 'js' })
    // 设置gltf解码器
    loader.setDRACOLoader(dracoLoader);
    loader.load(
        'models/zuo.glb',
        // 'models/city.glb',
        (gltf) => {
            // 成功加载回调
            const model = gltf.scene;
            console.log('建筑模型加载成功:', model);
            // 聚光灯照亮
            // spotLight.target = model
            // 调整模型属性
            // model.scale.set(40, 40, 40);
            model.scale.set(0.5, 0.5, 0.5);
            pointLightGui.add(model.position, 'x').min(-1000).max(1000).step(0.1).name("x");
            pointLightGui.add(model.position, 'y').min(0).max(100).step(0.1).name("y");
            pointLightGui.add(model.position, 'z').min(0).max(1000).step(0.1).name("z");
            // model.position.set(-587.8, 0, 600.4);
            model.position.set(0, 0, 50);
            model.traverse(child => {
                if(child.isMesh){
                    child.castShadow = true;  // 启用物体的阴影投射
                    child.receiveShadow = true;  // 启用物体接收阴影
                    child.material = new THREE.MeshPhysicalMaterial({
                        color: child.material.color,
                        
                    })
                }
            })
            spotLight.target = model
            // 添加到场景
            scene.add(model);
        },
        (progress) => {
            // 加载进度回调
            const percent = (progress.loaded / progress.total) * 100;
            console.log(`加载进度: ${percent}%`);
        },
        (error) => {
            // 错误处理
            console.error('加载建筑模型时出错:', error);
        }
    );
}


onMounted(() => {
    init();
    setTimeout(() => {
        
    }, 1000);
})
</script>