
import * as THREE from 'three';

let scene = null
let speed = 0.002 // 飞线速度

// 几何体飞线
export default 
/**
 * 两点链接飞线
 * */
function lineConnect(sceneOut, posStart, posEnd, height = 10, speedOut = 0.002) {
    scene = sceneOut || null
    speed = speedOut || null
    // 根据目标坐标设置3D坐标  z轴位置在地图表面
    const [x0, y0, z0] = [...posStart, height]
    const [x1, y1, z1] = [...posEnd, height]

    // 使用QuadraticBezierCurve3() 创建 三维二次贝塞尔曲线
    const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(x0, y0, z0),
        new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, 20),
        new THREE.Vector3(x1, y1, z1)
    )

    // 绘制 目标位置
    spotCircle([x0, y0, z0])
    spotCircle([x1, y1, z1])
    moveSpot(curve)

    const lineGeometry = new THREE.BufferGeometry()
    // 获取曲线 上的50个点
    var points = curve.getPoints(50)
    var positions = []
    var colors = []
    var color = new THREE.Color()

    // 给每个顶点设置演示 实现渐变
    for (var j = 0; j < points.length; j++) {
        color.setHSL(0.81666 + j, 0.88, 0.715 + j * 0.0025) // 粉色
        colors.push(color.r, color.g, color.b)
        positions.push(points[j].x, points[j].y, points[j].z)
    }
    // 放入顶点 和 设置顶点颜色
    // lineGeometry.setAttribute
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3, true))
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3, true))

    const material = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors, side: THREE.DoubleSide })
    const line = new THREE.Line(lineGeometry, material)

    requestAnimationFrame(render)

    return line
}

// 圆环网格对象组
const circleYs = []
/**
 * 目标位置
 * */
function spotCircle(spot) {
    // 圆
    const geometry1 = new THREE.CircleGeometry(0.5, 200)
    const material1 = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide })
    const circle = new THREE.Mesh(geometry1, material1)
    // 绘制地图时 y轴取反 这里同步
    circle.position.set(spot[0], spot[1], spot[2] + 0.1)
    scene.add(circle)

    // 圆环
    const geometry2 = new THREE.RingGeometry(0.5, 0.7, 50)
    // transparent 设置 true 开启透明
    const material2 = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true })
    const circleY = new THREE.Mesh(geometry2, material2)
    // 绘制地图时 y轴取反 这里同步
    circleY.position.set(spot[0], spot[1], spot[2] + 0.1)
    scene.add(circleY)

    circleYs.push(circleY)
}

// 移动物体网格对象组
const moveSpots = []
/**
 * 线上移动物体
 * */
function moveSpot(curve) {
  
    // 线上的移动物体
    const aGeo = new THREE.SphereGeometry(0.4, 0.4, 0.4)
    const aMater = new THREE.MeshPhongMaterial({ color: 0xff0000, side: THREE.DoubleSide })
    const aMesh = new THREE.Mesh(aGeo, aMater)
    // 保存曲线实例
    aMesh.curve = curve
    aMesh._s = 0

    moveSpots.push(aMesh)

    scene.add(aMesh)
}

// 渲染
function render() {
  circleYs.forEach(function (mesh) {
      //  目标 圆环放大 并 透明
      mesh._s += 0.01
      mesh.scale.set(1 * mesh._s, 1 * mesh._s, 1 * mesh._s)
      if (mesh._s <= 2) {
          mesh.material.opacity = 2 - mesh._s
      } else {
          mesh._s = 1
      }
  })
  
  moveSpots.forEach(function (mesh) {
      mesh._s += speed
      let tankPosition = new THREE.Vector3()
      tankPosition = mesh.curve.getPointAt(mesh._s % 1)
      mesh.position.set(tankPosition.x, tankPosition.y, tankPosition.z)
  })
  
  requestAnimationFrame(render)
}

