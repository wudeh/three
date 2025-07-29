import * as THREE from 'three'

export default function Cloud(scene, camera, renderer){

    function createRandom(min = 0, max = 1) {
        return Math.random() * (max - min) + min;
    }
    const vs = /* glsl */ `
        varying vec2 vUv;
        void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
        `;

        const fs = /* glsl */ `
        varying vec2 vUv;
        uniform sampler2D map;
        uniform float fogNear;
        uniform float fogFar;
        uniform vec3 fogColor;
        uniform int enableFog; // 0: false, 1: true
        
        void main(){
            if(enableFog == 1){
            // 计算片源深度 
            float depth = gl_FragCoord.z / gl_FragCoord.w;
            // 计算归一化的深度
            float fogFactor = smoothstep(fogNear, fogFar, depth);
            // 计算雾透明度
            gl_FragColor.w *= pow(gl_FragCoord.z, 20.0);
            // 最终结果
            gl_FragColor = mix(texture2D(map, vUv), vec4(fogColor, gl_FragColor.w), fogFactor);
            }else{
            gl_FragColor = texture2D(map, vUv);
            }
        }
        `

        async function init() {
            const dummy = new THREE.Object3D();
            const mouse = new THREE.Vector2();
            const halfSize = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
            const startTime = Date.now();
            const params = {
                count: 800,
                enableFog: true,
                fogColor: '#4584b4',
                fogNear: -100,
                fogFar: 3000,
            };



            // background
            const backgroundCanvas = document.createElement("canvas");
            const ctx = backgroundCanvas.getContext("2d");
            const gradient = ctx.createLinearGradient(0, 0, 0, backgroundCanvas.height);
            gradient.addColorStop(0, "#1e4877");
            gradient.addColorStop(0.5, "#4584b4");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

            const bgTexture = new THREE.CanvasTexture(backgroundCanvas);
            scene.background = bgTexture;

            // cloud
            const loader = new THREE.TextureLoader();
            const cloudTexture = await loader.loadAsync(
                `https://file.threehub.cn/` + 'images/channels/cloud.png'
            );

            const geometry = new THREE.PlaneGeometry(64, 64);
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    map: {
                        value: cloudTexture,
                    },
                    fogColor: {
                        value: new THREE.Color(params.fogColor),
                    },
                    fogNear: {
                        value: params.fogNear,
                    },
                    fogFar: {
                        value: params.fogFar,
                    },
                    enableFog: {
                        value: Number(params.enableFog),
                    }
                },
                vertexShader: vs,
                fragmentShader: fs,
                depthWrite: true,
                depthTest: false,
                transparent: true,
            });

            const mesh = new THREE.InstancedMesh(geometry, material, params.count);
            mesh.position.y = 800
            mesh.position.z = -250
            scene.add(mesh);


            function updateMeshCount() {
                const count = params.count;
                mesh.count = count;
                mesh.dispose();
                mesh.instanceMatrix = new THREE.InstancedBufferAttribute(
                    new Float32Array(count * 16),
                    16
                );

                for (let j = 0, k = count; j < k; j++) {
                    dummy.position.x = createRandom(-50000, 50000);
                    dummy.position.y = -Math.random() * Math.random() * 200 - 15;
                    dummy.position.z = j;
                    dummy.rotation.z = Math.random() * Math.PI;
                    dummy.rotation.x = Math.PI / 180 * 90
                    dummy.scale.x = dummy.scale.y = Math.random() * Math.random() * 1.5 + 0.5;
                    dummy.updateMatrix();
                    mesh.setMatrixAt(j, dummy.matrix);
                }

                mesh.instanceMatrix.needsUpdate = true;
                // camera.position.z = count;
                // camera.far = count * 1.5;
                camera.updateProjectionMatrix();
            }

            updateMeshCount();

            function render() {
                // camera.position.x += (mouse.x - camera.position.x) * 0.01;
                // camera.position.y += (-mouse.y - camera.position.y) * 0.01;
                // camera.position.z = -((Date.now() - startTime) * 0.03) % params.count + params.count;
                requestAnimationFrame(render);
            }
            render();


            // renderer.domElement.addEventListener("mousemove", ({ clientX, clientY }) => {
            //     mouse.set(
            //         (clientX - halfSize.x) * 0.25,
            //         (clientY - halfSize.y) * 0.15
            //     );
            // })

            // resize(renderer, [camera], () => {
            //     halfSize.set(window.innerWidth / 2, window.innerHeight / 2);
            // })
        }

        init()
}