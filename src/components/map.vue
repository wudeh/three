<template>
    <div class="map" ref="conatinerRef"></div>
    <div class="menu">
      <el-tooltip placement="left">
        <template #content>
          <div @click="codeScene">数字代码</div>
          <div @click="waterScene('sun')">太阳湖面</div>
          <div @click="waterScene('qingtian')">晴天湖面</div>
          <div @click="waterScene('lantian')">蓝天湖面</div>
          <div @click="waterScene('yewan')">夜晚湖面</div>
        </template>
        <span>场景切换</span>
      </el-tooltip>
    </div>
</template>

<script setup>
import * as THREE from "three"
import * as d3 from "d3"
import { OrbitControls } from 'three/examples/jsm/controls/orbitControls.js'
import { onMounted, useTemplateRef } from "vue";
//导入tween 补间动画
import { Tween, Group } from "three/examples/jsm/libs/tween.module.js";
import TWEEN from '@tweenjs/tween.js';
import { createFlyCurve } from "../utils/chinaLine"
import chinaJson from "../assets/json/china.json"
import CodeScene from "../utils/codeChange"
// 引入CSS3渲染器CSS3DRenderer
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import Water1 from "../utils/Water"
import addSky from "../utils/Sky";
import lineConnect from "../utils/FlyLine1"
import Water2 from "../utils/Water2";


const conatinerRef = useTemplateRef('conatinerRef')

const animationGroup = new Group()

let scene = null
let camera = null
let renderer = null 

let mapModel = null

let mapDepth = 3

let provinceTween = [] // 省份鼠标 hover 动画

const imgTween = []

let labelRenderer = null

// 创建3D渲染器 - 初始化时调用
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
function createDialogHtml(pos){
    let name = pos.name.replace('省', '').replace('市', '')
    if(name === '内蒙古自治区') name = '内蒙古'
    if(name.includes('自治区')) name = name.slice(0, 2)
    if(name.includes('行政区')) name = name.slice(0, 2)

    // 创建弹窗
    const labelDiv = document.createElement('div');
    labelDiv.innerHTML = `<div style="color:white">${name}</div>`;
    // 创建CSS3DObject并设置其位置
    const boxObject = new CSS3DObject(labelDiv);
    boxObject.position.set( pos.x, pos.y, pos.z );
    boxObject.scale.set(0.1,0.1)
    scene.add(boxObject);
}

const mouseEvent = () => {
  // 添加鼠标事件
  addEventListener('mousemove', function (event) {
    // 鼠标点击的坐标转化
    const container = conatinerRef.value;
    const px = (event.offsetX / window.innerWidth) * 2 - 1;
    const py = -(event.offsetY / window.innerHeight) * 2 + 1;
    // 获取射线交点
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(px, py), camera);
    const interscet = raycaster.intersectObjects([mapModel]);

    // 省份重置动画
    const resetAni = (v, j) => {
      if(v.position.z !== 0){
        const tween = new Tween(v.position, animationGroup)
          .to({z: 0}, 300)
          .onUpdate((o) => {
              v.position.set(0,0,o.z)
          })
          .onComplete(() => {
            j.isHover = false;
          })
          .start()
        provinceTween.push(tween)
      }
    }
    // 省份浮动动画
    const Ani = (v) => {
      const tween = new Tween(v.position, animationGroup)
          .to({z: 5}, 300)
          .onUpdate((o) => {
              v.position.set(0,0,o.z)
          })
          .start()
          // .repeat(0)
        provinceTween.push(tween)
    }
      
      // 判断是否有物体与射线相交
      //   i.object.material.color.set(0xff0000);
    if (interscet.length > 0) {            
          mapModel.children.forEach(j => {
            if(j.properties.name === interscet[0].object.parent.properties.name){
              if(!j.isHover){
                j.isHover = true
                j.children.forEach(k => {
                  // if(k.type == 'Mesh') {
                    Ani(k)
                  // }
                })
              }
            }else{
              j.children.forEach(k => {
                // if(k.type == 'Mesh') {
                  resetAni(k,j)
                // }
              })
            }
            
          })            
    }else{
      mapModel.children.forEach(i => {
        if(i.isHover){
          i.isHover = false
          i.children.forEach(k => {
            // if(k.type == 'Mesh') {
              resetAni(k,i)
            // }
          })
        }
      })
    }
  });
}

  // 墨卡托投影转换
    const projection = d3.geoMercator()
      .center([104.0, 37.5])
      .scale(80)
      .translate([0, 0]);
  // 创建地图对象并添加到场景中
  const createMap = (data, scene) => {
    // 初始化一个地图对象
    const map = new THREE.Object3D();
    

    // 找到北京中心
    const beijing = data.features.find((i) => i.properties.name === '北京市').properties.centroid;
    data.features.forEach(
      (elem) => {
        // 创建一个省份3D对象
        const province = new THREE.Object3D();
        // 设置省份的名称
        if(elem.properties.centroid){
          const [x,y] = projection(elem.properties.centroid)
          createDialogHtml({x, y: -y, z:2, name: elem.properties.name})
        }
        // 设置飞线
        // if(elem.properties.name !== '北京市' && elem.properties.centroid){
        //   const [x,y] = projection(elem.properties.centroid)
        //   flyLineArr.push({ begin: projection(beijing), end: [x, y*-1], height: 5 })
        // }
        // 每个的 坐标 数组
        const { coordinates } = elem.geometry;
        
        // 循环坐标数组
        coordinates.forEach((multiPolygon) => {
          multiPolygon.forEach((polygon) => {
            const shape = new THREE.Shape();

            // 给每个省的边界画线
            const lineGeometry = new THREE.BufferGeometry();
            const pointsArray = [];
            for (let i = 0; i < polygon.length; i++) {
              const projectionResult = projection(polygon[i]);
              if (projectionResult) {
                const [x, y] = projectionResult;
                if (i === 0) {
                  shape.moveTo(x, -y);
                } else {
                  shape.lineTo(x, -y);
                }
                pointsArray.push(new THREE.Vector3(x, -y, mapDepth));
              }
            }
            lineGeometry.setFromPoints(pointsArray);

            const extrudeSettings = {
              depth: mapDepth,
              bevelEnabled: false,
              bevelThickness: 1,
              bevelSize: 2,
              bevelOffset: 0,
              bevelSegments: 1,
            };
            // 根据二维形状 挤压 立体
            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            const textureMap = new THREE.TextureLoader().load('/img/rocks.jpg');
            textureMap.wrapS = THREE.RepeatWrapping; // 在U方向（水平）平铺
            textureMap.wrapT = THREE.RepeatWrapping;// 在V方向（垂直）平铺
            textureMap.repeat.set(0.03, 0.03);// 数字越小贴图越大
            textureMap.offset.set(0.52,0.52) // 贴图位置
            const topFaceMaterial = new THREE.MeshPhongMaterial({
              // map: textureMap,
              // color: new THREE.Color().setRGB(0,0,0),
              color: "#00A4A4",
              // combine: THREE.MultiplyOperation,
              transparent: true,
              opacity: 0.5,
            });
            const material2 = new THREE.MeshPhongMaterial({
              color: '#00A4A4',
              transparent: true,
              opacity: 0.8,
            });

            const mesh = new THREE.Mesh(geometry, [topFaceMaterial, material2]);
            mesh.castShadow = true
            mesh.receiveShadow = true
            const lineMaterial = new THREE.LineBasicMaterial({
              color: "white",
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            // 将省份的属性 加进来
            // @ts-ignore
            province.properties = elem.properties;
            
            province.add(mesh);
            province.add(line);
          });
        });
        map.add(province);
      }
    );
    map.position.set(0, 0, 0);
    // map.rotation.x = -Math.PI / 180 * 45
    scene.add(map);
    mapModel = map;

    // 添加中国地图边界流动线
    const chinaPolints = []
    chinaJson.features[0].geometry.coordinates.flat(2).forEach((i,index) => {
      const projectionResult = projection(i);
        if (projectionResult) {
          const [x, y] = projectionResult;
          chinaPolints.push(new THREE.Vector3(x, -y, mapDepth));
        }
    })
    const flyLine = createFlyCurve(chinaPolints, true, new THREE.Color(0xE6FEFF), 0.1)
    scene.add(flyLine)

    // 添加飞线

    // 添加鼠标移动事件
    mouseEvent()
  };

  // 加载地图数据
  const loadMapData = (scene) => {
    THREE.Cache.enabled = true;
    const loader = new THREE.FileLoader();
    loader.load("https://hv.z.wiki/autoupload/20241128/T4OS/content.json", (data) => {
      const jsondata = JSON.parse(data);
      createMap(jsondata, scene);
    })};

  // 画底部旋转图片动画
  const drawImage = () => {
    const imgGroup = new THREE.Group()
    const textureLoader = new THREE.TextureLoader();

    const bgTexture1 = textureLoader.load( './img/ring_9.png' );
    bgTexture1.colorSpace = THREE.SRGBColorSpace;

    const bgTexture2 = textureLoader.load( './img/ring_9.png' );
    bgTexture2.colorSpace = THREE.SRGBColorSpace;


    const geometry1 = new THREE.PlaneGeometry( 80,80 );
    const material1 = new THREE.MeshBasicMaterial( { map: bgTexture1, depthWrite: false, transparent: true} );
    const plane1 = new THREE.Mesh( geometry1, material1 );

    const geometry2 = new THREE.PlaneGeometry( 60,60 );
    const material2 = new THREE.MeshBasicMaterial( { map: bgTexture2, depthWrite: false, transparent: true} );
    const plane2 = new THREE.Mesh( geometry2, material2 );

    imgGroup.add(plane1, plane2)

    // imgGroup.rotation.x = -Math.PI / 180 * 45

    const coords = {z: 0}
    const tween = new Tween(coords, animationGroup)
        .to({z: 360}, 25000)
        .onUpdate(() => {
            plane1.rotation.z = Math.PI / 180 * coords.z
            plane2.rotation.z = -Math.PI / 180 * coords.z
        })
        .start()
        .repeat(Infinity)


    function render() {
        renderer.render(scene,camera);//执行渲染操作
        labelRenderer.render(scene, camera);//执行CSS3D渲染
        // 执行更新所有动画
        animationGroup.update()
        // 暂停整个Group
        // group.getAll().forEach(t => t.pause())
        // mesh.rotateY(0.01);//每次绕y轴旋转0.01弧度
        requestAnimationFrame(render);//请求再次执行渲染函数render
    }
    render();
    var controls = new OrbitControls(camera, renderer.domElement);
    // 已经通过requestAnimationFrame(render);周期性执行render函数，没必要再通过监听鼠标事件执行render函数
    // controls.addEventListener('change', render)


    scene.add( imgGroup );

}


const init = () => {
    const container = conatinerRef.value;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    scene = new THREE.Scene();

    // 更新窗口变化
    // window.addEventListener("resize", () => {
    //   // 重置渲染器宽高比
    //   renderer.setSize(window.innerWidth, window.innerHeight);
    //   // 重置相机宽高比
    
    //   camera.aspect = window.innerWidth / window.innerHeight;
    //   // 更新相机投影矩阵
    //   camera.updateProjectionMatrix();
    // });

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 100);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // 直射光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 50);
    directionalLight.position.set(10, 10, 10); // 设置光源的位置
    // scene.add(directionalLight);

    // 环境光
    const ambientLight = new THREE.AmbientLight(0xcfffff);
    ambientLight.intensity = 1;
    scene.add(ambientLight);

    // 点光
    var pointLight = new THREE.PointLight(new THREE.Color().setRGB(209,166,204), 10,100000);
    pointLight.position.set(0, 0, 10);
    // scene.add(pointLight);

    // 坐标轴 辅助
    var axes = new THREE.AxesHelper(700)
    scene.add(axes)

    
    createCss3DRender()

    loadMapData(scene)

    // initCodeScene(scene, camera)
    
    drawImage()
    

    // 添加飞线，注意 y轴要取反
    const [x1, y1] = projection([116.41995, 40.18994])// 北京
    const [x2, y2] = projection([114.077429, 44.331087]) // 内蒙古
    const [x3, y3] = projection([127.693027, 48.040465]) // 黑龙江
    const [x4, y4] = projection([121.438737, 31.072559]) // 上海
    const [x5, y5] = projection([118.006468, 26.069925]) // 福建
    const [x6, y6] = projection([87.617099, 43.863737]) // 新疆
    const line = lineConnect(scene, [x1, -y1], [x2, -y2], 3)
    scene.add(line)
    const line2 = lineConnect(scene, [x1, -y1], [x3, -y3], 3)
    scene.add(line2)
    const line3 = lineConnect(scene, [x1, -y1], [x4, -y4], 3)
    scene.add(line3)
    const line4 = lineConnect(scene, [x1, -y1], [x5, -y5], 3)
    scene.add(line4)
    const line5 = lineConnect(scene, [x1, -y1], [x6, -y6], 3)
    scene.add(line5)
}

// 切换到数字代码场景
let waterObj = null; // 水面场景对象
let waterType = '' // 水面类型
let codeObj = null; // 数字代码场景对象
// 初始化数字代码场景
const codeScene = () => {
    waterType = ''
    // 清除水面场景
    if(waterObj) {
        waterObj.destroy()
        waterObj = null
    }
    // 清除天空盒
    addSky(scene, renderer, 'none')
    
    scene.background = new THREE.Color(0x000000); // 设置背景颜色为黑色

    // 添加数字场景
    if(!codeObj) {
      codeObj = new CodeScene(scene, camera)
    }
}

// 切换到水面场景

const waterScene = (v) => {
    
    // 清除数字代码场景
    if(codeObj) {
        codeObj.destroy()
        codeObj = null
    }
    if(waterType != v) {
        waterType = v
        if(!waterObj) waterObj = new Water1(scene, {x: 0, y: -38, z: 0})
        // 加载天空盒
        addSky(scene, renderer, v)
    }
    
}

onMounted(() => {
    setTimeout(() => {
        init()
    }, 1000)    
})
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
            width: 80px;
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
            width: 80px;
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

.menu {
    position: absolute;
    color: #fff;
    top: 50%;
    transform: translateY(-50%);
    right: 10px;
    z-index: 1000;
}
</style>