import * as THREE from "three"

export default class AutoMove {
    scene;
    model;
    position;

    // position 是位置数组[{x:x,y:y,z:z}]
    constructor(scene, model, position){
        this.scene = scene
        this.model = model
        this.position = position
        this.init()
    }

    init(scene, model, position){
        // 创建一个曲线
        const curve = new THREE.CatmullRomCurve3(position.map(i => new THREE.Vector3(i.x, i.y, i.z)))

        // 创建曲线几何
        const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(500))

        // 创建曲线材质
        const material = new THREE.LineBasicMaterial({ color: 0xffffff })

        // 创建曲线
        const curveMesh = new THREE.Line(geometry, material)

        // 添加曲线到场景
        scene.add(curveMesh)

        scene.add(model)
        // 定义时间
        let t = 0

        model.render = () => {

            t += 0.0004

            const point = curve.getPointAt(t % 1) // 获取当前点

            model.position.set(point.x, point.y, point.z) // 设置位置

            model.lookAt(curve.getPointAt((t + 0.01) % 1)) // 朝向下一个点

        }

        animate()

        function animate() {
            if(!this.model) return;
            requestAnimationFrame(animate)
            car?.render()

        }
    }

    destroy(){
        this.scene.remove(this.model)
        this.model = null
    }
}