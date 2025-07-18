import * as Three from "three"
// 创建发光粒子
const creatLight = (scene, center) => {
  // 创建粒子几何体
  const geometry = new Three.BufferGeometry();
  const count = 1;

  // 创建顶点位置数组
  const positions = new Float32Array(count * 3);

  // 随机生成粒子位置和颜色
  for (let i = 0; i < count; i++) {
      // 位置
      positions[i * 3] = center[0];     // x
      positions[i * 3 + 1] = center[1]; // y
      positions[i * 3 + 2] = 1; // z
  }

  // 设置属性
  geometry.setAttribute('position', new Three.BufferAttribute(positions, 3));

  function createLightMateria() {
  let canvasDom = document.createElement('canvas');
  canvasDom.width = 16;
  canvasDom.height = 16;
  let ctx = canvasDom.getContext('2d');
  //根据参数确定两个圆的坐标，绘制放射性渐变的方法，一个圆在里面，一个圆在外面
  let gradient = ctx.createRadialGradient(
      canvasDom.width/2,
      canvasDom.height/2,
      0,
      canvasDom.width/2,
      canvasDom.height/2,
      canvasDom.width/2);
    gradient.addColorStop(0,'rgba(255,255,255,1)');
    gradient.addColorStop(0.005,'rgba(139,69,19,1)');
    gradient.addColorStop(0.4,'rgba(139,69,19,1)');
    gradient.addColorStop(1,'rgba(0,0,0,1)');
    //设置ctx为渐变色
    ctx.fillStyle = gradient;
    //绘图
    ctx.fillRect(0,0,canvasDom.width,canvasDom.height);

    //贴图使用
    let texture = new Three.Texture(canvasDom);
    texture.needsUpdate = true;//使用贴图时进行更新
    return texture;
  }

  const pointsMaterial = new Three.PointsMaterial({
      color:0xffffff,
      size:2,
      transparent:true,//使材质透明
      blending:Three.AdditiveBlending,
      depthTest:false,//深度测试关闭，不消去场景的不可见面
      map:createLightMateria()//刚刚创建的粒子贴图就在这里用上
  })

  // 创建粒子系统
  const particles = new Three.Points(geometry, pointsMaterial);
  // particles.rotation.x = -Math.PI / 180 * 45
  scene.add(particles);
}

export default creatLight;