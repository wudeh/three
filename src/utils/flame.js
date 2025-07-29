import * as THREE from 'three';

export default function flame(scene, renderer){


    const flameShader = {
    uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2(1, 1) }
    },

    vertexShader: `
        varying vec2 vUv;
        void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    fragmentShader: `
        uniform vec2 iResolution;
        uniform float iTime;
        varying vec2 vUv;

        float noise(vec3 p) {
        vec3 i = floor(p);
        vec4 a = dot(i, vec3(1., 57., 21.)) + vec4(0., 57., 21., 78.);
        vec3 f = cos((p-i)*acos(-1.))*(-.5)+.5;
        a = mix(sin(cos(a)*a), sin(cos(1.+a)*(1.+a)), f.x);
        a.xy = mix(a.xz, a.yw, f.y);
        return mix(a.x, a.y, f.z);
        }

        float sphere(vec3 p, vec4 spr) {
        return length(spr.xyz-p) - spr.w;
        }

        float flame(vec3 p) {
        float d = sphere(p*vec3(1.,.5,1.), vec4(.0,-1.,.0,1.));
        return d + (noise(p+vec3(.0,iTime*2.,.0)) + noise(p*3.)*.5)*.25*(p.y);
        }

        float scene(vec3 p) {
        return min(100.-length(p), abs(flame(p)));
        }

        vec4 raymarch(vec3 org, vec3 dir) {
        float d = 0.0, glow = 0.0, eps = 0.02;
        vec3 p = org;
        bool glowed = false;
        
        for(int i=0; i<64; i++) {
            d = scene(p) + eps;
            p += d * dir;
            if(d > eps) {
            if(flame(p) < 0.0) glowed = true;
            if(glowed) glow = float(i)/64.;
            }
        }
        return vec4(p, glow);
        }

        void main() {
        vec2 uv = -1.0 + 2.0 * vUv;
        uv.x *= iResolution.x/iResolution.y;
        
        vec3 org = vec3(0., -2., 4.);
        vec3 dir = normalize(vec3(uv.x*1.6, -uv.y, -1.5));
        
        vec4 p = raymarch(org, dir);
        float glow = p.w;
        
        vec4 col = mix(vec4(1.,.5,.1,1.), vec4(0.1,.5,1.,1.), p.y*.02+.4);
        
        gl_FragColor = mix(vec4(0.), col, pow(glow*2.,4.));
        }
    `
    };

    // 使用示例
    const geometry = new THREE.PlaneGeometry(3, 3);
    const material = new THREE.ShaderMaterial({
        ...flameShader,
        depthWrite: false,
        transparent: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    // mesh.rotation.y = -Math.PI / 180 * 90
    scene.add(mesh);
    

    // 更新uniforms
    function animate() {
        requestAnimationFrame(animate);
        
        material.uniforms.iTime.value += 0.01;
        material.uniforms.iResolution.value.set(
            renderer.domElement.width,
            renderer.domElement.height
        );
    
    }

    animate();

}