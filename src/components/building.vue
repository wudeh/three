<template>
    <div class="map" ref="conatinerRef"></div>
    <Popover
        ref="popoverRef"
    ></Popover>
    <div class="fireMask" v-show="showPopover">警告</div>
    <div class="menu">
      <el-tooltip placement="left">
        <template #content>
          <div @click="autoFire">自动灭火</div>
          <div @click="walk">场景巡视</div>
          <div @click="autoFix">自动修复</div>
          <div @click="showHot">机器温度</div>
          <div @click="toggle">开关灯泡</div>
        </template>
        <span>场景演示</span>
      </el-tooltip>
    </div>
</template>

<script setup>
import * as THREE from "three"
import * as d3 from "d3"
import { OrbitControls } from 'three/examples/jsm/controls/orbitControls.js'
import { onMounted, ref, useTemplateRef } from "vue";
//导入tween 补间动画
import { Tween, Group } from "three/examples/jsm/libs/tween.module.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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

// 引入CSS3渲染器CSS3DRenderer
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';

// 引入管道
import Tube from '../utils/Tube.js';
import addSky from "../utils/Sky";

// 指定模型辉光
import ModelBloom from "../utils/ModelBloom.js";
// 火焰
import Fire from "../utils/fire2.js"
import WaterFlower from "../utils/WaterFlower.js"
import FireFlower from "../utils/FireFlower.js"
import ThirdPersonMove from "../utils/ThirdPersonMove.js"

import popover from "./Popover/index.vue"
import { ElNotification } from "element-plus";


const conatinerRef = useTemplateRef('conatinerRef')
const popoverRef = useTemplateRef('popoverRef') // 全屏警告
const showPopover = ref(false)

const animationGroup = new Group()

let scene = null
let camera = null
let renderer = null 

let controls = null

let flyModel = null // 无人机模型
let warnModel = null // 红温机器
const originMaterial = [] // 红温机器的原来材质
const rackModel = []    // 保存所有机器模型
let fixPopover = null // 修理弹框
let warnHtml = null // 告警弹框

// 相机动画函数，从A点飞行到B点，A点表示相机当前所处状态
// pos: 三维向量Vector3，表示动画结束相机位置
// target: 三维向量Vector3，表示相机动画结束lookAt指向的目标观察点
function createCameraTween(endPos,endTarget){
    new Tween({
        // 不管相机此刻处于什么状态，直接读取当前的位置和目标观察点
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        tx: controls.target.x,
        ty: controls.target.y,
        tz: controls.target.z,
    }, animationGroup)
    .to({
        // 动画结束相机位置坐标
        x: endPos.x,
        y: endPos.y,
        z: endPos.z,
        // 动画结束相机指向的目标观察点
        tx: endTarget.x,
        ty: endTarget.y,
        tz: endTarget.z,
    }, 2000)
    .onUpdate(function (obj) {
        // 动态改变相机位置
        camera.position.set(obj.x, obj.y, obj.z);
        // 动态计算相机视线
        // camera.lookAt(obj.tx, obj.ty, obj.tz);
        controls.target.set(obj.tx, obj.ty, obj.tz);
        controls.update();//内部会执行.lookAt()
    })
    .start();
}

// 创建3D渲染器 - 初始化时调用
let labelRenderer = null
function createCss3DRender(){
    labelRenderer = new CSS3DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0px";
    //设置.pointerEvents=none，解决HTML元素标签对THREEjs canvas画布鼠标事件的遮挡
    labelRenderer.domElement.style.pointerEvents = 'none';
    conatinerRef.value.appendChild(labelRenderer.domElement);

}

 // 创建弹框 - 点击时调用
function createDialogHtml(pos, item){

    // 创建弹窗
    const labelDiv = document.createElement('div');
    labelDiv.id = 'myDialog'
    labelDiv.innerHTML = `
  <div class="box-container">
    <div class=${item.status == 0 ? 'tip-green' : 'tip-red'} >
			<div class="title">设备名称 : ${item.name}</div>
			<div class="label-text">
				温度 :
				<span class="mr5" class=${item.tempState == '0' ? 'label-value-green' : 'label-value-red'}>
          ${item.temperature}
				</span>
				<span class=${item.tempState == '0' ? 'label-value-green' : 'label-value-red'}>
				 ${item.tempState == '0' ? '正常' : '报警'}
				</span>
			</div>
			<div class="label-text">
				流量 :
				<span class="mr5" class=${item.leakageState == '0' ? 'label-value-green' : 'label-value-red'}>
          ${item.leakage}
        </span>
				<span class=${item.leakageState == '0' ? 'label-value-green' : 'label-value-red'}>
					${item.leakageState == '0' ? '正常' : '报警'}
				</span>
			</div>
		</div>
    <div class=${item.status == 0 ? 'line-green' : 'line-red'}></div>
  </div>
		  `;
    // 创建CSS3DObject并设置其位置
    const boxObject = new CSS3DObject(labelDiv);
    // 这里改位置是因为要挪到目标位置中心，原来的位置在机器的一个角
    boxObject.position.set( pos.x + 0.5, pos.y + 2.5, pos.z + 0.4 );
    boxObject.scale.set(0.02,0.02)
    if(item.status != 0) warnHtml = boxObject
    scene.add(boxObject);
}

 // 创建修理弹框
function createFixHtml(pos){

    // 创建弹窗
    const labelDiv = document.createElement('div');
    labelDiv.innerHTML = `
        <div class="fix_container">
            <div class="tip-green">
                    修理中
                </div>
        </div>
		  `;
    // 创建CSS3DObject并设置其位置
    const boxObject = new CSS3DObject(labelDiv);
    // 这里改位置是因为要挪到目标位置中心，原来的位置在机器的一个角
    boxObject.position.set( pos.x, pos.y, pos.z);
    boxObject.scale.set(0.02,0.02)
    fixPopover = boxObject
    scene.add(boxObject);
}

let sphere = null // 灯泡
let pointLight = null // 灯泡
let pointLight2 = null // 灯泡
const toggle = () => {
        if(sphere.visible){
            pointLight2.power = 0
            sphere.visible = false
            pointLight.intensity = 0
            return
        }else{
            pointLight.intensity = 0.2
            pointLight2.power = 1000
            sphere.visible = true
        }
        
    }
const init = () => {
    const container = conatinerRef.value;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // 启用渲染器的阴影
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(10, 10, 10);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    createCss3DRender()

    // 直射光
    const directionalLight = new THREE.DirectionalLight(0xEDD9CC, 1);
    directionalLight.intensity = 0; // 设置光强度
    directionalLight.position.set(5, 5, -5); // 设置光源的位置
    directionalLight.castShadow = true;  // 启用光源的阴影投射
    scene.add(directionalLight);

    // 创建聚光灯照亮特定区域
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(5, 5, -5);
    spotLight.intensity = 0; // 设置光强度
    spotLight.castShadow = true;  // 启用光源的阴影投射
    // spotLight.target = someObject; // someObject为需要照亮的物体，聚光灯会指向这个目标
    scene.add(spotLight);

    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    ambientLight.intensity = 0; // 设置环境光强度
    scene.add(ambientLight);

    // 点光
    pointLight = new THREE.PointLight(new THREE.Color().setRGB(209,166,204), 1);
    pointLight.position.set(5, 7, -7);
    pointLight.castShadow = true;  // 启用光源的阴影投射
    pointLight.intensity = 0.2;  // 启用光源的阴影投射
    pointLight.distance = 26;  // 启用光源的阴影投射
    scene.add(pointLight);
    // 创建灯罩
    const geometry = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI)
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff })
    sphere = new THREE.Mesh(geometry, material)
    sphere.position.set(5, 7, -7)
    pointLight2 = new THREE.PointLight(0xffffff, 1, 100)
    pointLight2.power = 1000
    sphere.add(pointLight2)
    sphere.rotation.x = -Math.PI / 180 * 45
    scene.add(sphere)
    
    

    //实例化一个gui对象
    // const gui = new GUI()
    // gui.domElement.style.width = "300px";
    // const pointLightGui = gui.addFolder("点光");
    // folder.add(控制对象，对象具体属性，属性参数最小值，属性参数最大值)
    // pointLightGui.add(sphere.position, 'x').min(-30).max(30).step(1).name("x");
    // pointLightGui.add(sphere.position, 'y').min(-30).max(30).step(1).name("y");
    // pointLightGui.add(sphere.position, 'z').min(-30).max(30).step(1).name("z");
    // pointLightGui.add(pointLight, 'intensity').min(0).max(30).step(0.1).name("点灯光强度");
    // pointLightGui.add(pointLight, 'distance').min(0).max(30).step(0.1).name("点灯光距离");
    // pointLightGui.add(ambientLight, 'intensity').min(0).max(30).step(1).name("环境光强度");
    // pointLightGui.add(directionalLight, 'intensity').min(0).max(30).step(1).name("直射光强度");
    // pointLightGui.add(spotLight, 'intensity').min(0).max(600).step(0.2).name("聚光灯强度");
    // // 坐标轴 辅助
    var axes = new THREE.AxesHelper(700)
    // scene.add(axes)

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
        bloomStrength: 0.6, // 辉光强度
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
    // pointLightGui.add(bloomPass, 'strength').min(0).max(30).step(0.1).name("辉光强度");
    composer.addPass(bloomPass);
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    

    // 创建流动管道
    const pointsArr = [
        [2.5, 0, 14.3],
        [2.5, 0, 0.3]
    ];
    // const tube = new Tube(scene, pointsArr);

    

    
    
    controls = new OrbitControls(camera, renderer.domElement);
    // 限制垂直旋转角度
    controls.minPolarAngle = Math.PI / 4; // 45度
    controls.maxPolarAngle = Math.PI / 2.5; // 限制最大仰角
    function render() {
        renderer.render(scene,camera);//执行渲染操作
        labelRenderer.render(scene, camera);//执行CSS3D渲染
        // 执行更新所有动画
        animationGroup.update()
        // 渲染外发光通道
        composer.render();
        
        // 暂停整个Group
        // group.getAll().forEach(t => t.pause())
        // mesh.rotateY(0.01);//每次绕y轴旋转0.01弧度
        controls.update();//更新控制器
        requestAnimationFrame(render);//请求再次执行渲染函数render
    }
    render();
    // 创建指定辉光
    // const ModelBloomObj = new ModelBloom(scene, camera, renderer)
    // ModelBloomObj.bloom(sphere)

    

    

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
        'models/datacenter.glb',
        (gltf) => {
            // 成功加载回调
            const model = gltf.scene;
            console.log('机房模型加载成功:', model);
            // 聚光灯照亮
            // spotLight.target = model
            // 调整模型属性
            model.scale.set(1, 1, 1);
            model.position.set(0, 0, 0);
            model.traverse(function (child) { // 遍历模型的所有子对象
                if (child.isMesh) { // 检查子对象是否是网格（Mesh）对象
                    child.castShadow = true;  // 启用物体的阴影投射
                    child.receiveShadow = true;  // 启用物体接收阴影
                }
                // 给某一个机子加上警告弹窗
                if(child.name == "rackA_6"){
                    warnModel = child
                    createDialogHtml(child.position, {
                        name: child.name,
                        tempState: 1,
                        temperature: '98度',
                        leakage: '1400G',
                    })
                    child.traverse((i) => {
                        if(i.isMesh){
                            originMaterial.push(i.material)
                            i.material = new THREE.MeshPhongMaterial({
                                side: THREE.DoubleSide,
                                transparent: true,
                                depthTest: false,
                                depthWrite: true, // 无法被选择，鼠标穿透
                                color: 'red',
                                opacity: 1,
                            });
                        }
                        
                    })
                }
                if(child.name.includes("rack")){
                    rackModel.push(child)
                }
                // ModelBloomObj.bloom(child)
            });
            
            building.add(model);
            // 添加到场景
            scene.add(building);
            
            
            // // 播放动画（如果有）
            if (gltf.animations && gltf.animations.length) {
                const mixer = new THREE.AnimationMixer(model);
                const action = mixer.clipAction(gltf.animations[0]);
                action.play();
                
                // 在动画循环中更新混合器
                function animate() {
                    requestAnimationFrame(animate);
                    const delta = new THREE.Clock().getDelta();
                    // 更新混合器
                    mixer.update(delta);
                    renderer.render(scene, camera);
                }
                animate();
            }
        },
        (progress) => {
            // 加载进度回调
            const percent = (progress.loaded / progress.total) * 100;
            console.log(`加载进度: ${percent}%`);
        },
        (error) => {
            // 错误处理
            console.error('加载机房模型时出错:', error);
        }
    );

    // 加载无人机模型
    const loader2 = new GLTFLoader();
    loader2.setDRACOLoader(dracoLoader);
    loader2.load(
        'models/drone.glb',
        // 'https://file.threehub.cn/files/model/Fox.glb',
        (gltf) => {
            console.log('无人机模型加载成功:', gltf);
            // 成功加载回调
            const model = gltf.scene;
            flyModel = model
            // 调整模型属性
            model.scale.set(0.5, 0.5, 0.5);
            model.position.set(2.6, 2, -7.1);
            // 添加到场景
            scene.add(model); 

            model.traverse(function (child) { // 遍历模型的所有子对象
                if (child.isMesh) { // 检查子对象是否是网格（Mesh）对象
                    child.castShadow = true;  // 启用物体的阴影投射
                    child.receiveShadow = true;  // 启用物体接收阴影
                }
            });

            // pointLightGui.add(model.position, 'x').min(-30).max(30).step(0.1).name("无人机x");
            // pointLightGui.add(model.position, 'z').min(-30).max(30).step(0.1).name("无人机z");
            
            // // 播放动画（如果有）
            if (gltf.animations && gltf.animations.length) {
                console.log('无人机模型有动画');

                const mixer = new THREE.AnimationMixer(model) // 模型动画
                const action = mixer.clipAction(gltf.animations[0])
                const clock = new THREE.Clock()
                model.mixerUpdate = () => mixer.update(clock.getDelta())
                action.play()
                
                // 在动画循环中更新混合器
                function animate() {
                    requestAnimationFrame(animate);                   
                    model.mixerUpdate()
                }
                animate();
            }
        },
        (progress) => {
            // 加载进度回调
            const percent = (progress.loaded / progress.total) * 100;
            console.log(`无人机加载进度: ${percent}%`);
        },
        (error) => {
            // 错误处理
            console.error('加载无人机模型时出错:', error);
        }
    );

    // 添加网格辅助
    // scene.add(new THREE.GridHelper(100, 40))
    const bottomFloor = new THREE.PlaneGeometry(10000, 10000); // 创建一个平面几何体作为水面
        const glassCurtainWallMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xadd8e6,        // 淡蓝色玻璃的颜色 (透射色)
        // color: 0xffffff,        // 淡蓝色玻璃的颜色 (透射色)
        metalness: 0.0,         // 玻璃是非金属
        roughness: 0.05,        // 非常光滑的玻璃，产生清晰反射
        transmission: 0.9,      // 透射率，90%的光线可以穿透玻璃
        ior: 1.52,              // 折射率 (Index of Refraction)，普通玻璃的典型值
        envMap: scene.environment,
        envMapIntensity: 1.8,   // 环境反射强度 (之前是1.0，调高以增强反射)
        transparent: true,      // 必须开启，以启用透明效果和透射
        opacity: 0.2,          // 不透明度 (之前是0.8)。注意：transmission 和 opacity 会相互影响
        thickness: 0.1          // 玻璃的厚度，影响透射光的衰减和色散（如果启用了相关高级特性）
    });
    const textureMap = new THREE.TextureLoader().load('/img/floorImg.png');
    textureMap.wrapS = THREE.RepeatWrapping; // 在U方向（水平）平铺
    textureMap.wrapT = THREE.RepeatWrapping;// 在V方向（垂直）平铺
    textureMap.repeat.set(4000, 4000);// 数字越小贴图越大
    const topFaceMaterial = new THREE.MeshPhysicalMaterial({
        map: textureMap,
    });

    const mesh = new THREE.Mesh(bottomFloor, topFaceMaterial);
    mesh.rotation.x = -Math.PI / 180 * 90
    mesh.castShadow = true;  // 启用物体的阴影投射
    mesh.receiveShadow = true;  // 启用物体接收阴影
    scene.add(mesh);
    
    
    // scene.background = new THREE.Color(0x87ceeb); // 设置天空背景颜色
    // addSky(scene, camera, 'sun');
    // 添加鼠标事件
  addEventListener('mousemove', function (event) {
    // 鼠标点击的坐标转化
    const container = conatinerRef.value;
    const px = (event.offsetX / window.innerWidth) * 2 - 1;
    const py = -(event.offsetY / window.innerHeight) * 2 + 1;
    // 获取射线交点
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(px, py), camera);
    const interscet = raycaster.intersectObjects([building]);
      
      // 判断是否有物体与射线相交
      //   i.object.material.color.set(0xff0000);
    if (interscet.length > 0) {
          // 往父级找到名称包含 rack 的就是机器  
          function findRack(obj){
            if(obj.name && obj.name.includes('rack')){
                return obj
            }else{
                if(obj.parent) return findRack(obj.parent)
                return null;
            }
          }
          const rack = findRack(interscet[0].object)  
          if(rack) {
            // 渲染点击模块外发光
            outlinePass.selectedObjects = [rack];
            let data = {
                name: rack.name,
                top: event.offsetY,
                left: event.offsetX,
                wendu: '45度',
                liuliang: '123G',
            }
            popoverRef.value.setShow(true, data);
            // 相机跑向模型，并指向模型，因为模型比较高，所以 y 轴加2
            //const pos2 = rack.position.clone().addScalar(5);
            //const lookPostion = rack.position.clone()
            //lookPostion.y = lookPostion.y + 1
            //createCameraTween(pos2, lookPostion)
          }else{
            outlinePass.selectedObjects = [];
            popoverRef.value.setShow(false);
          }    
    }})

    
}

onMounted(() => {
    setTimeout(() => {
        init();
    }, 1000);
})

// 灭火演示
let fireModel = null
let waterModel = null
const autoFire = () => {
    ElNotification.warning("检测到高温险情！")
    // 创建火焰
    const fire = new Fire({x:1,y:6,z:1});
    fireModel = fire
    fire.position.set(0,2,0)
    // pointLightGui.add(fire.position, 'z').min(-30).max(30).step(0.1).name("火焰z");
    // pointLightGui.add(fire.position, 'x').min(-30).max(30).step(0.1).name("火焰x");
    scene.add(fire);
    
    // 加载纹理
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('img/fire2.png', (texture) => {
        fire.setTexture(texture);
        fire.material.opacity = 0.01
    });
    // 火焰动画循环
    const clock = new THREE.Clock();
    // 火焰渲染动画
    function render(){
        if(fireModel){
            fire.update(clock.getElapsedTime())
            requestAnimationFrame(render)
        }
    }
    render()

    // 展示全屏警告
    showPopover.value = true

    // 3s 后创建水花 开始灭火
    setTimeout(() => {
        
        ElNotification.warning("自动洒水系统触发！")
        setTimeout(() => {
            ElNotification.warning("正在灭火中！！！")
        }, 300);
        // 水花效果
        waterModel = WaterFlower(scene)
        scene.add(waterModel)
        // 水花渲染动画
        function render(){
            if(waterModel){
                waterModel.render()
                requestAnimationFrame(render)
            }
            
        }
        render()

        // 3s 后灭火完成，关闭所有
        setTimeout(() => {
            showPopover.value = false
            scene.remove(fireModel)
            // 关闭水花
            WaterFlower(scene, 'close')
            ElNotification.success("灭火成功！！！")
            // 水花关闭后要等一会再删除水模型，不然会有水花粒子残留
            setTimeout(() => {
                ElNotification.success("温度已正常！")
                scene.remove(waterModel)
                fireModel = null
                waterModel = null
            }, 1000);
        }, 3000);
    }, 3000);
}

// 控制狐狸场景走动
let isWaking = null
const walk = () => {
    // WaterFlower(scene, 'close')
    if(!isWaking){
        ElNotification.success('按wasd键移动！')
        isWaking = new ThirdPersonMove(scene,camera,{x:10,y:10,z:10},'./models/Fox.glb',{x:5,y:0,z:-5})
    }else{
        isWaking.destroy()
        isWaking = null
    }
}

const clearModel = (model) => {
    if(model.geometry){
        model.geometry.dispose()
        if(model.geometry.attributes) model.geometry.attributes = null
    }
    if(model.material){
        model.material.dispose()
        if(model.material.map){
            model.material.map.dispose()
        }
    }
}

// 自动修复
const autoFix = () => {
    let pos = flyModel.position.clone() // 无人机初始位置
    createFixHtml(pos)    // 创建修理中弹框
    let pos1 = warnModel.position.clone() // 红温机器位置
    pos1.y = pos1.y + 2.2
    ElNotification.warning('无人机开始执行修理任务！')
    // 无人机从初始位置飞到红温机器上面
    new Tween(flyModel.position, animationGroup)
        .to(pos1, 3000)
        .onUpdate((o) => {
            fixPopover.position.set(o.x,o.y+1,o.z)
        })
        .onComplete(() => {
            // 到达红温机器位置，创建火花
            let FireFlowerModel = new FireFlower(scene)
            FireFlowerModel.getMesh().scale.set(0.01,0.01,0.01)
            FireFlowerModel.getMesh().position.set(pos1.x,pos1.y,pos1.z)
            // 3s 后返回
            setTimeout(() => {
                ElNotification.warning('无人机修理完成！')
                // 删除告警弹框
                if(warnHtml) scene.remove(warnHtml)
                // 删除火花
                FireFlowerModel.delete()
                FireFlowerModel = null
                // 删除修理中弹框
                scene.remove(fixPopover)
                // 恢复红温机器原材质
                if(originMaterial.length){
                    warnModel.traverse((i) => {
                        if(i.isMesh){
                            i.material = originMaterial.shift()
                        }
                    })
                }
                
                new Tween(pos1, animationGroup)
                    .to(pos, 3000)
                    .onUpdate((o) => {
                        flyModel.position.set(o.x, o.y, o.z)
                    })
                    .onComplete(() => {
                        // 回到原位置
                        console.log('原位置')
                        
                    })
                    .start()
            }, 3000);
        })
        .start()
}

// 机器温度展示，切换红色材质，随机透明度
const originAllMaterial = [] // 机器的原来材质
const showHot = () => {
    if(!originAllMaterial.length){
        // 循环把所有机器的材质切换，保存
        rackModel.forEach(i => {
            let opacity = Math.random()
            i.traverse(j => {
                if(j.isMesh){
                    originAllMaterial.push(j.material)
                    j.material = new THREE.MeshPhongMaterial({
                        side: THREE.DoubleSide,
                        transparent: true,
                        depthTest: false,
                        depthWrite: true, // 无法被选择，鼠标穿透
                        color: 'red',
                        opacity
                    });
                    
                }
                
            })
        })
    }else{
        // 循环把所有机器的材质切换回原材质
        rackModel.forEach(i => {
            i.traverse(j => {
                if(j.isMesh){
                    j.material = originAllMaterial.shift()
                }
            })
        })
    }
}
</script>

<style scoped>
.map {
    width: 100%;
    height: 100vh;
}

:deep(#myDialog) {
    font-size: 8px;

    .box-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        animation: moveUpDown 3s infinite;

        .title {
            font-family: Source Han Sans CN, Source Han Sans CN;
            font-weight: bold;
            color: #fff;
        }

        .label-text {
            font-family: Source Han Sans CN, Source Han Sans CN;
            color: #ccddff;

            .label-value-green {
                color: #5cdd2e;
                font-weight: bold;
            }
            .label-value-red {
                color: #ff4a4a;
                font-weight: bold;
            }
        }

        .tip-green {
            width: 100px;
            height: 40px;
            padding: 5px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background-color: rgba(22, 29, 38, 0.5);
            opacity: 0.9;
            border: 1px solid #329550;
            box-shadow: inset 0px 0px 15px 0px #329550;
        }

        .tip-red {
            width: 100px;
            height: 40px;
            padding: 5px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background-color: rgba(22, 29, 38, 0.5);
            opacity: 0.9;
            border: 1px solid #882c2c;
            box-shadow: inset 0px 0px 15px 0px #882c2c;
        }

        .line-green {
            width: 1px;
            height: 35px;
            background: linear-gradient(to bottom, rgba(28, 107, 51, 0.3), rgb(20, 195, 93), rgba(1, 165, 75, 0.89));
        }

        .line-red {
            width: 1px;
            height: 35px;
            background: linear-gradient(to bottom, rgba(123, 44, 28, 0.3), rgba(255, 82, 82, 1), rgba(255, 48, 48, 0.89));
        }
    }
}
 
/* // 动画 */
@keyframes moveUpDown {
	0% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(8px);
	}
	100% {
		transform: translateY(0);
	}
}

/* // 报警红色动画 */
@keyframes Warning {
	0% {
		opacity: 0;
	}
	50% {
		opacity: 0.3;
	}
	100% {
		opacity: 0;
	}
}

/* 火灾警告 */
.fireMask{
    position: absolute;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    background-color: red;
    animation: Warning 1s infinite;
    z-index: 111;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 500px;
    font-weight: bold;
}

/* 场景演示 */
.menu {
    position: absolute;
    color: #fff;
    top: 50%;
    transform: translateY(-50%);
    right: 10px;
    z-index: 1000;
}

:deep(.fix_container){
    display: flex;
    align-items: center;
    justify-content: center;
    .tip-green {
        width: 100px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(22, 29, 38, 0.5);
        opacity: 0.9;
        border: 1px solid #329550;
        box-shadow: inset 0px 0px 15px 0px #329550;
        font-weight: bold;
        color: #fff;
        font-size: 26px;
    }
}
</style>