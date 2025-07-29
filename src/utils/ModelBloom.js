// 导入必要的 Three.js 核心和后期处理模块
import * as THREE from 'three'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'


export default class ModelBloom {

  constructor(scene, camera, renderer){
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.init(scene, camera, renderer)
  }

  init(scene, camera, renderer){
    // 后期处理
    const renderScene = new RenderPass(scene, camera)
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.4, 0.0)
    const bloomComposer = new EffectComposer(renderer)
    bloomComposer.renderToScreen = false
    bloomComposer.addPass(renderScene)
    bloomComposer.addPass(bloomPass)

    const finalPass = new ShaderPass(
        new THREE.ShaderMaterial({
            uniforms: {
                baseTexture: { value: null },
                bloomTexture: { value: bloomComposer.renderTarget2.texture },
            },
            vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
            `,
            fragmentShader: `
            uniform sampler2D baseTexture;
            uniform sampler2D bloomTexture;
            varying vec2 vUv;
            void main() {
                gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
            }
            `,
            defines: {},
        }),
        "baseTexture"
    )
    finalPass.needsSwap = true
    const finalComposer = new EffectComposer(renderer)
    finalComposer.addPass(renderScene)
    finalComposer.addPass(finalPass)

    // 点击切换辉光
    // window.addEventListener("click", onClick)
    // function onClick(event) {
    //     const raycaster = new THREE.Raycaster()
    //     const mouse = new THREE.Vector2(
    //         (event.offsetX / event.target.clientWidth) * 2 - 1,
    //         -(event.offsetY / event.target.clientHeight) * 2 + 1
    //     )
    //     raycaster.setFromCamera(mouse, camera)
    //     const intersects = raycaster.intersectObjects(scene.children)
    //     if (intersects.length > 0)  intersects[0].object.layers.toggle(1) // 切换图层
    // }

    // 窗口大小变化
    // window.onresize = function () {
    //     camera.aspect = window.innerWidth / window.innerHeight
    //     camera.updateProjectionMatrix()
    //     renderer.setSize(window.innerWidth, window.innerHeight)
    //     bloomComposer.setSize(window.innerWidth, window.innerHeight)
    //     finalComposer.setSize(window.innerWidth, window.innerHeight)
    // }

    // 辉光图层
    const bloomLayer = new THREE.Layers()
    bloomLayer.set(1)

    const darkMaterial = new THREE.MeshBasicMaterial({ color: "black" })
    const materials = {}

    render()
    function render() {
        requestAnimationFrame(render)
        scene.traverse(obj => {
            if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
                materials[obj.uuid] = obj.material // 保存原材质
                obj.material = darkMaterial	// 替换材质
            }
        })
        bloomComposer.render() // 渲染到bloomComposer
        scene.traverse(obj => {
            if (materials[obj.uuid]) {
                obj.material = materials[obj.uuid] // 恢复原材质
                delete materials[obj.uuid] // 删除原材质
            }
        })
        finalComposer.render()
    }
  }

  bloom(model){
    model.layers.toggle(1) // 切换图层
  }
}


/**
 * 指定物体显示辉光
 * @param {*} scene 
 * @param {*} camera 
 * @param {*} renderer 
 * @param {*} objArr 需要辉光的模型物体数组
 */
function ModelBloom2(scene, camera, renderer, objArr){
  // 后期处理
  const renderScene = new RenderPass(scene, camera)
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.4, 0.0)
  const bloomComposer = new EffectComposer(renderer)
  bloomComposer.renderToScreen = false
  bloomComposer.addPass(renderScene)
  bloomComposer.addPass(bloomPass)

  const finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
          uniforms: {
              baseTexture: { value: null },
              bloomTexture: { value: bloomComposer.renderTarget2.texture },
          },
          vertexShader: `
          varying vec2 vUv;
          void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          }
          `,
          fragmentShader: `
          uniform sampler2D baseTexture;
          uniform sampler2D bloomTexture;
          varying vec2 vUv;
          void main() {
              gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
          }
          `,
          defines: {},
      }),
      "baseTexture"
  )
  finalPass.needsSwap = true
  const finalComposer = new EffectComposer(renderer)
  finalComposer.addPass(renderScene)
  finalComposer.addPass(finalPass)

  // 点击切换辉光
  // window.addEventListener("click", onClick)
  // function onClick(event) {
  //     const raycaster = new THREE.Raycaster()
  //     const mouse = new THREE.Vector2(
  //         (event.offsetX / event.target.clientWidth) * 2 - 1,
  //         -(event.offsetY / event.target.clientHeight) * 2 + 1
  //     )
  //     raycaster.setFromCamera(mouse, camera)
  //     const intersects = raycaster.intersectObjects(scene.children)
  //     if (intersects.length > 0)  intersects[0].object.layers.toggle(1) // 切换图层
  // }

  // 窗口大小变化
  // window.onresize = function () {
  //     camera.aspect = window.innerWidth / window.innerHeight
  //     camera.updateProjectionMatrix()
  //     renderer.setSize(window.innerWidth, window.innerHeight)
  //     bloomComposer.setSize(window.innerWidth, window.innerHeight)
  //     finalComposer.setSize(window.innerWidth, window.innerHeight)
  // }

  // 辉光图层
  const bloomLayer = new THREE.Layers()
  bloomLayer.set(1)

  const darkMaterial = new THREE.MeshBasicMaterial({ color: "black" })
  const materials = {}

  render()
  function render() {
      requestAnimationFrame(render)
      scene.traverse(obj => {
          if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
              materials[obj.uuid] = obj.material // 保存原材质
              obj.material = darkMaterial	// 替换材质
          }
      })
      bloomComposer.render() // 渲染到bloomComposer
      scene.traverse(obj => {
          if (materials[obj.uuid]) {
              obj.material = materials[obj.uuid] // 恢复原材质
              delete materials[obj.uuid] // 删除原材质
          }
      })
      finalComposer.render()
  }

  // 指定物体显示辉光
  objArr.forEach(i => {
    console.log('fff',i)
    i.layers.toggle(1) // 切换图层
  })
}