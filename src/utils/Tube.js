import * as THREE from 'three';

// 创建流动管道
export default class Tube {
    scene;
    mesh;

    /**
     * @param {THREE.Scene} scene 场景
     * @param {Array} pointsArr 管道路径点数组
     * 格式：[[x1, y1, z1], [x2, y2, z2], ...]
     * 例如：[[0, 0, 0], [10, 10, 10], [20, 5, 15]]
     */
    constructor(scene, pointsArr) {
        this.scene = scene;
        this.createTube(pointsArr);
    }

    createTube(pointsArr) {
        

        

        const curve = this.createPath(pointsArr);

        // 2. 创建管道体
        const tubeGeometry = new THREE.TubeGeometry(curve, 1000, 0.5, 10, false);
        // 纹理贴图：一定要使用透明背景的图片，否则贴图会全部叠在一起，看不出来效果
        const texLoader = new THREE.TextureLoader();
        // 图片可以用这张：http://pic.yupoo.com/mazhenghjj/e546038d/9610773f.jpg
        const texture = texLoader.load('./img/blue_light.png'); 
        // 允许横纵设置矩阵（人话就是可以平铺）
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.x = 10; // 横向平铺次数，越多流动图片越多越快
        texture.repeat.y = 1;
        texture.offset.y = 0.5;
        

        // 3. 创建管道材质
        const tubeMaterial = new THREE.MeshPhongMaterial({
            map: texture, // 颜色贴图
            transparent: true,
            color: 0x47d8fa,
            side: THREE.DoubleSide,
        });

        // 底部网格（可以不设置）
        const gridHelper = new THREE.GridHelper(300, 25, 0x004444, 0x004444);
        // this.scene.add(gridHelper);

        const mesh = new THREE.Mesh( tubeGeometry, tubeMaterial );
        mesh.position.y = 2;
        mesh.position.x = 0;
        // mesh.rotateZ(3.14);
        // mesh.scale.set(2, 2, 2);
        this.mesh = mesh;
        // 4. 把几何体（管道）和 材质 生成的网格物体添加到场景中
        this.scene.add( mesh );

        function render() {
            texture.offset.x -= 0.04; // 每次渲染时，纹理的横向偏移量减小0.04，这样就形成了流动的效果
            requestAnimationFrame(render);//请求再次执行渲染函数render
        }
        render();
    }

    // 创建管道
    createPath(pointsArr) {
        // 将参数数组转换成点数组的形式
        pointsArr = pointsArr.map((point) => new THREE.Vector3(...point));
        // 自定义三维路径 curvePath
        const path = new THREE.CurvePath();
        for (let i = 0; i < pointsArr.length - 1; i++) {
            // 每两个点之间形成一条三维直线
            const lineCurve = new THREE.LineCurve3(pointsArr[i], pointsArr[i + 1]); 
            // curvePath有一个curves属性，里面存放组成该三维路径的各个子路径
            path.curves.push(lineCurve); 
        }
        return path;
    }

    getMesh() {
        return this.mesh;
    }

    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.mesh = null;
        }
    }

}