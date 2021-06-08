'use strict';

/**
 * three.js 관련 스크립트와 워커용 스크립트를 분리해서 작성한 이유
 * 
 * 현재 모든 브라우저가 OffscreenCanvas를 지원하는 게 아님. 
 * 그래서 OffscreenCanvas를 지원할 경우에만 워커를 사용하고,
 * 지원하지 않을 경우 기존처럼 메인 스크립트에서 바로 렌더링 처리하도록 하려는 것.
 * 
 * 그래서 shared-cubes.js에는 three.js로 반응형 페이지를 만드는 코드만 남겨놓고,
 * 그와 관련없는 나머지 worker와 관련된 코드는 잘라내서 지금 여기의 워커용 스크립트에 붙여넣은거임.
 * 
 * 그래서 shared-cubes.js에 존재하는 state 객체와 init함수를 워커용 스크립트, 메인 스크립트에서 import해서
 * 두 스크립트 중 하나에서 상황에 따라(즉, 브라우저가 OffscreenCanvas를 지원하는지에 따라) init과 state를 사용하려는거임. 
 */

import {
  init,
  state
} from './shared-cubes.js';

// size 함수가 호출될때 전달받는 data에는 {type: 'size', width: canvas.clientWidth, height: canvas.clientHeight} 가 들어있음.
// 여기서 리사이징된 캔버스의 사이즈를 참조하여 state 객체에 할당해 줌.
function size(data) {
  state.width = data.width;
  state.height = data.height;
}

// Worker.onmessage에 할당된 함수에서 message 이벤트의 e.data.type안에 담긴 이름과 동일한 함수를 가져갈 수 있도록 함수들을 모아놓은 객체
const handlers = {
  init, // 이렇게 하면 main(key): main(value) 이렇게 할당되겠지
  size
};

/**
 * self
 * 
 * 이거는 window.self와 동일한 코드로 일반적인 윈도우 컨텍스트에서는 단순 전역객체인 window 객체 자체를 반환하는 속성일 뿐임.
 * 
 * 그러나, self는 일반적으로 Web Worker 컨텍스트에서 주로 활용함.
 * 이 때의 self는 전용 워커는  DedicatedWorkerGlobalScope, 공유 워커는 SharedWorkerGlobalScope, 서비스 워커는 ServiceWorkerGlobalScope 를 각각 가리킨다고 함.
 * 어쨋거나 보통 워커 스트립트에서 self를 이용하여 message 이벤트에 대한 이벤트리스너를 등록함으로써
 * 해당 웹 워커에 이벤트를 등록하겠다는 표현방식으로써 자주 사용함.
 * 
 * 여기서도 Worker.onmessage에 함수를 할당하기 위해서 self를 사용함.
 * 이렇게 해주면 메인 스크립트에서 Worker.postMessage()를 호출함으로써 
 * message 이벤트를 워커에 발생시키면 워커 스크립트의 워커 전역 객체가 이벤트를 감지하여 할당된 함수를 호출시킴.
 */
self.onmessage = function (e) {
  const fn = handlers[e.data.type]; // e.data.type안에 담긴 이름과 동일한 key값을 가진 함수를 fn에 할당함.
  if (!fn) {
    // fn에 할당된 함수가 존재하지 않는다면 새로운 Error 객체를 생성하고 던짐.
    throw new Error('no handler for type: ' + e.data.type); // 참고로 Error 객체를 생성한 후에는 보통 throw 키워드를 이용해 던짐으로써 오류를 처리함.
  }
  fn(e.data); // fn에 할당된 함수가 존재한다면 e.data(message 이벤트에 담긴 {type: '어쩌구저쩌구', canvas: offscreen} 객체)를 전달하면서 해당 함수 호출하라는 뜻.
}