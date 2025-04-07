// @ts-ignore
import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, loader, model, audio, listener, audioLoader;

// Declare variables at the top
let mouseX = 0, mouseY = 0; // Variables to store mouse position
const moveSpeed = 0.05; // Speed of movement
let isJumping = false; // Flag to track if the model is currently jumping
let jumpSpeed = 0.01; // Speed of the jump
let jumpHeight = 1; // Maximum height of the jump
let jumpDirection = 1; // 1 for upward, -1 for downward
let isAudioPlaying = false; // Custom flag to track if the audio is playing

const canvas = document.getElementById('scene');
init();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1, 3);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(light);

  loader = new GLTFLoader();

  // Audio setup
  listener = new THREE.AudioListener();
  camera.add(listener);
  audio = new THREE.Audio(listener);
  audioLoader = new THREE.AudioLoader();

  animate();
}

window.loadAnimal = function(name) {
    const modelPath = `./public/assets/models/${name}.glb`;
    const soundPath = `./public/assets/sounds/${name}.mp3`;

  if (model) {
    scene.remove(model);
    model.traverse(obj => {
      if (obj.isMesh) obj.geometry.dispose();
    });
  }

  loader.load(modelPath, gltf => {
    model = gltf.scene;
    // model.scale.set(1.5, 1.5, 1.5);
    model.scale.set(.25, .25, .25);
    scene.add(model);
  });

  audioLoader.load(soundPath, buffer => {
    audio.setBuffer(buffer);
    audio.setLoop(false);
    audio.setVolume(1.0);
    audio.play();
  });
}



// Add event listener for mouse movement
window.addEventListener('mousemove', (event) => {
  // Normalize mouse position to range [-1, 1]
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1; // Invert Y-axis
});

// Add event listener for mouse click
window.addEventListener('mousedown', (event) => {
  if (model) {
    // Check if the mouse is clicking on the object
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(model, true);
    if (intersects.length > 0 && !isJumping) {
      isJumping = true; // Start the jump
    }
  }
});

function animate() {
    requestAnimationFrame(animate);
  
    // Move the model based on mouse movement
    if (model) {
      model.position.x += (mouseX * 5 - model.position.x) * moveSpeed; // Smooth movement on X-axis
      model.position.z += (mouseY * 5 - model.position.z) * moveSpeed; // Smooth movement on Z-axis
    }
  
    // Handle jumping logic
    if (isJumping && model) {
      model.position.y += jumpSpeed * jumpDirection;
  
      // Reverse direction when reaching the maximum height or ground level
      if (model.position.y >= jumpHeight) {
        jumpDirection = -1; // Start moving downward
      } else if (model.position.y <= 0) {
        jumpDirection = 1; // Reset to upward direction
        isJumping = false; // End the jump
        model.position.y = 0; // Ensure the model stays on the ground
      }
    }
  
    // Check if the model is in the camera's view
    if (model && isAudioPlaying) {
      const frustum = new THREE.Frustum();
      const cameraViewProjectionMatrix = new THREE.Matrix4();
  
      camera.updateMatrixWorld(); // Ensure the camera's world matrix is updated
      cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);
  
      // Check if any child of the model is in the frustum
      let isVisible = false;
      model.traverse((child) => {
        if (child.isMesh && frustum.intersectsObject(child)) {
          isVisible = true;
        }
      });
  
      // Stop the audio if the model is not visible
      if (!isVisible) {
        audio.stop();
        isAudioPlaying = false; // Update the custom flag
      }
    }
  
    renderer.render(scene, camera);
  }

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
