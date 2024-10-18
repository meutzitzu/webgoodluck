import {
    Mesh,
    MeshStandardMaterial,
    PerspectiveCamera,
    Scene,
    SphereGeometry,
    WebGLRenderer,
  } from "three";
  
  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  
  export enum GPUPerformanceLevel {
    HIGH = "HIGH",
    LOW = "LOW",
  }
  
  function approxRollingAverage(
    average: number,
    value: number,
    history = 50
  ) {
    average -= average / history;
    average += value / history;
  
    return average;
  }
  
  /**
   * Three.js based webgl benchmark
   *
   * In summary, the `run` method adds `meshPerStep` new spheres every step (frame)
   * and measures the fps. If we're able to perform >=`thresholds.steps` of these
   * steps, without the fps dropping below `thresholds.fps`, then we label the device
   * `GPUPerformanceLevel.HIGH`.
   */
  export class GPUBenchmark {
    scene = new Scene();
    material = new MeshStandardMaterial();
    geometry = new SphereGeometry();
  
    static thresholds = { fps: 10, steps: 50 };
    static meshPerFrame = 1000;
    static framesPerStep = 5;
  
    async run(debug = false): Promise<GPUPerformanceLevel> {
      const camera = new PerspectiveCamera(75);
      const renderer = new WebGLRenderer();
  
      let tPrev = performance.now() / 1000;
      let steps = 0;
      let meshCnt = 0;
      let fps = 30;
  
      let passedThreshold = false;
  
      const animate = async () => {
        const time = performance.now() / 1000;
        const fpsMeasured = Math.min(1 / (time - tPrev), 120);
        tPrev = time;
  
        fps = approxRollingAverage(fps, fpsMeasured, 5);
  
        if (debug) {
          console.log(`fps: ${fps} fpsMeasured: ${fpsMeasured} steps: ${steps} meshCnt: ${meshCnt}`);
        }
  
        if (
          fps > GPUBenchmark.thresholds.fps &&
          steps < GPUBenchmark.thresholds.steps
        ) {
          requestAnimationFrame(animate);
  
          if (steps++ % GPUBenchmark.framesPerStep == 0) {
            meshCnt += this.step();
          }
          renderer.render(this.scene, camera);
        } else {
          passedThreshold = true;
        }
      };
  
      animate();
  
      while (!passedThreshold) {
        await sleep(1);
      }
  
      this.cleanup();
      renderer.dispose();
      const level = GPUBenchmark.stepsToPerfLevel(steps);
  
      if (debug) {
        console.log("device benchmarked at level:", level);
      }
  
      return level;
    }
  
    private step(): number {
      const meshPerStep = GPUBenchmark.meshPerFrame * GPUBenchmark.framesPerStep;
      for (let i = 0; i < meshPerStep; i++) {
        const sphere = new Mesh(this.geometry, this.material);
        sphere.frustumCulled = false;
  
        this.scene.add(sphere);
      }
  
      return meshPerStep;
    }
  
    private cleanup() {
      for (const obj of this.scene.children) {
        this.scene.remove(obj);
      }
  
      //@ts-ignore
      this.scene = null;
  
      this.material.dispose();
      this.geometry.dispose();
  
      //@ts-ignore
      this.material = null;
      //@ts-ignore
      this.geometry = null;
    }
  
    private static stepsToPerfLevel(numSteps: number): GPUPerformanceLevel {
      if (numSteps >= GPUBenchmark.thresholds.steps) {
        return GPUPerformanceLevel.HIGH;
      } else {
        return GPUPerformanceLevel.LOW;
      }
    }
  }