import * as THREE from "three"

export default function fire1(scene) {
    const texture = new THREE.TextureLoader().load('img/fire.png');
    const smokeTexture = new THREE.TextureLoader().load('img/smoke.png');
    const smokeMaterial = new THREE.SpriteMaterial({
        color: 0x000000,
        map: smokeTexture,
        transparent: true,
        opacity: 0.1,
    });
    let smokeGroup = new THREE.Group();
    
    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AddOperation
    });
    let fireGroup = new THREE.Group();
    for (let i = 0; i < 500; i++) {
        // 精灵模型共享材质
        const sprite = new THREE.Sprite(smokeMaterial);
        smokeGroup.add(sprite);
        sprite.scale.set(2, 2, 2);
        // 设置精灵模型位置，在长方体空间上上随机分布
        const x = 15 * (Math.random() - 0.5);
        const y = 3 * Math.random();
        const z = 8 * (Math.random() - 0.5);
        sprite.position.set(x, y, z)
    };
    for (let i = 0; i < 500; i++) {
        // 精灵模型共享材质
        const sprite = new THREE.Sprite(spriteMaterial);
        fireGroup.add(sprite);
        sprite.scale.set(2, 2, 2);
        // 设置精灵模型位置，在长方体空间上上随机分布
        const x = 15 * (Math.random() - 0.5);
        const y = 3 * Math.random();
        const z = 8 * (Math.random() - 0.5);
        sprite.position.set(x, y, z)
    };
    fireGroup.position.set(-8, 0, -6);
    smokeGroup.position.set(-8, 0, -6);
    const innerModel = new THREE.Object3D();
    innerModel.add(fireGroup, smokeGroup);
    scene.add(innerModel)
    function loop() {
        fireGroup.children.forEach(sprite => {
            // 火焰的y坐标每次
            sprite.position.y += 0.1;
            if (sprite.position.y > 3) {

                sprite.position.y = Math.random();
                // sprite.material.opacity = 1;
            }
        });
        smokeGroup.children.forEach(sprite => {
            // 火焰的y坐标每次
            sprite.position.y += 0.1;
            if (sprite.position.y > 6) {

                sprite.position.y = Math.random() + 3;
                
            }
        });
        requestAnimationFrame(loop);
    }
    loop();

}