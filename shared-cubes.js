'use strict';

import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';

// 메인 스크립트에서 resize 될때마다 메시지에 담아 보내주는 캔버스 사이즈를 할당할 객체 
export const state = {
  width: 300,
  height: 150 // 둘 다 캔버스의 기본 사이즈를 할당해놓음
}

// shared-cubes.js는 three.js 관련 코드만 따로 분리해놓은 코드이고, 
// 이 코드를 워커용 스크립트(offscreencanvas-worker-cubes.js)와 html내의 메인스크립트에서 모두 사용해야 함.
// 근데 메인스크립트에 이미 main이라는 이름의 함수가 존재하기 때문에 shared-cubes.js의 main함수의 이름을 init으로 수정한거임.
export function init(data) {
  // 얘는 뭐냐면, 지금 e.data는 {type: '어쩌구', canvas: offscreen}으로 되어있으니까
  // const canvas를 만들어서 key의 이름도 동일하게 canvas인 속성의 value(즉, offscreen)을 할당하라는거임.
  const {
    canvas
  } = data;
  const renderer = new THREE.WebGLRenderer({
    canvas
  });

  const fov = 75;
  const aspect = 2 // 캔버스의 가로 / 세로 비율. 캔버스의 기본 크기가 300 * 150이므로 캔버스 기본 비율과 동일하게 설정한 셈.
  const near = 0.1;
  const far = 5;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  camera.position.z = 2;

  const scene = new THREE.Scene();

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
  }

  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  function makeInstance(geometry, color, x) {
    const material = new THREE.MeshPhongMaterial({
      color
    });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.x = x;

    return cube;
  }

  const cubes = [
    makeInstance(geometry, 0x44aa88, 0),
    makeInstance(geometry, 0x8844aa, -2),
    makeInstance(geometry, 0xaa8844, 2),
  ];

  /**
   * three.js에서 레티나 디스플레이를 다루는 방법
   * (공식 문서에는 HD-DPI를 다루는 법이라고 나와있음.)
   * 
   * renderer.setPixelRatio(window.devicePixelRatio);
   * 
   * 위에 메소드를 사용해서 캔버스의 픽셀 사이즈를 CSS 사이즈에 맟출수도 있지만, 
   * 공식 문서에서는 추천하지 않는다고 함.
   * 
   * 그냥 아래와 같이 pixelRatio값을 직접 구한 뒤에 clientWidth,Height에 곱해주는 게 훨씬 낫다고 함.
   * 원래 2d canvas에 할때도 이렇게 했으니 하던대로 하면 될 듯.
   * 
   * 자세한 내용은 공식 문서 참고...
   */
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;

    // WebGLRenderer를 리사이징하는 메소드에서도 stage 객체의 값들을 쓰도록 변경해 줌.
    const width = state.width;
    const height = state.height;

    const needResize = canvas.width !== width || canvas.height !== height;

    if (needResize) {
      renderer.setSize(width, height, false);
    }

    return needResize;
  }

  function animate(t) {
    // 타임스탬프 값이 16.~~ms 이런식으로 밀리세컨드 단위로 리턴받는거를 0.016~~s의 세컨드 단위로 변환하려는 거.
    // 이제 매 프레임마다 갱신되는 세컨드 단위의 타임스탬프 값만큼 해당 mesh의 x축과 y축을 회전시키겠다는 거임.
    t *= 0.001;

    if (resizeRendererToDisplaySize(renderer)) {
      camera.aspect = state.width / state.height; // 카메라의 aspect도 state 객체의 값으로 계산하도록 변경해 줌.
      camera.updateProjectionMatrix();
    }

    cubes.forEach((cube, index) => {
      const speed = 1 + index * 0.1;
      const rotate = t * speed;
      cube.rotation.x = rotate;
      cube.rotation.y = rotate;
    });

    renderer.render(scene, camera);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}