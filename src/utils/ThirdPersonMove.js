import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Tween, Group } from "three/examples/jsm/libs/tween.module.js";

// 第三人称移动
export default class ThirdPersonMove {

    scene;
    originPosition;//原始位置
    camera;
    model;
    ModelUrl;
    keys = { w: false, s: false, a: false, d: false };
    
    constructor(scene, camera, originPosition, ModelUrl,startPosition){
        this.scene = scene
        this.camera = camera
        this.originPosition = originPosition
        this.ModelUrl = ModelUrl
        this.keys = { w: false, s: false, a: false, d: false };
        this.init(scene, camera, originPosition, ModelUrl, startPosition)
    }

    init(scene, camera, originPosition, ModelUrl, startPosition){
        // const urls = [0, 1, 2, 3, 4, 5].map(k => (`https://file.threehub.cn/` + 'files/sky/skyBox0/' + (k + 1) + '.png'))

        // const textureCube = new THREE.CubeTextureLoader().load(urls)
        // 加载模型
        new GLTFLoader().load(ModelUrl, (gltf) => {

            let character = gltf.scene
            this.model = character
            // character.traverse(i => i.isMesh && (i.material.envMap = textureCube))
            character.scale.set(0.5,0.5,0.5)
            character.position.set(startPosition.x,startPosition.y,startPosition.z)
            scene.add(character)
            character.scale.multiplyScalar(0.03)

            const mixer = new THREE.AnimationMixer(character) // 模型动画
            const action = mixer.clipAction(gltf.animations[1])
            const clock = new THREE.Clock()
            character.mixerUpdate = () => mixer.update(clock.getDelta())
            action.play()

            // 相机参数
            this.cameraOffset = new THREE.Vector3(0, 5, -5);
            this.smoothFactor = 0.1;
            this.moveSpeed = 0.06;
            this.turnSpeed = 0.03;

            this.down = (e) => {
                this.keys[e.key.toLowerCase()] = true
            }
            this.up = (e)=> {
                this.keys[e.key.toLowerCase()] = false
            }

            // 移动状态
            document.addEventListener('keydown', this.down);
            document.addEventListener('keyup', this.up);

            this._ani()

        })

        

    }

    update() {
        if (!this.model) return
        if (this.keys.a) this.model.rotation.y += this.turnSpeed;
        if (this.keys.d) this.model.rotation.y -= this.turnSpeed;
        if (this.keys.w || this.keys.s) {
            const dir = new THREE.Vector3();
            this.model.getWorldDirection(dir);
            this.model.position.add(dir.multiplyScalar(this.keys.w ? this.moveSpeed : -this.moveSpeed));
        }
        if(this.keys.a || this.keys.d || this.keys.w || this.keys.s) this.model.mixerUpdate()

        const targetPos = this.model.position.clone().add(this.cameraOffset.clone().applyQuaternion(this.model.quaternion));
        this.camera.position.lerp(targetPos, this.smoothFactor);
        this.camera.lookAt(this.model.position.clone().add(new THREE.Vector3(0, 1, 0)));

    }


    _ani(){
        if(this.model){
            this.update()
            requestAnimationFrame(this._ani.bind(this))
        }
        
    }

    destroy(){
        document.removeEventListener('keydown', this.down);
        document.removeEventListener('keyup', this.up);
        this.scene.remove(this.model)
        this.model = null
        let t = new Tween(this.camera.position)
                .to(this.originPosition, 2000)
                .onUpdate(v => {
                    this.camera.lookAt(0,0,0)
                })
                .onComplete(() => {
                    t = null
                })
                .start();
        function ani(){
            if(t){
                t.update()
                requestAnimationFrame(ani)
            }
        }
        ani()        
    }

}