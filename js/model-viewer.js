const modelOpenButtons = document.querySelectorAll("[data-model-open]");
const activeViewers = new Set();

let threeModulesPromise = null;
let activeModal = null;

const loadThreeModules = () => {
    if (!threeModulesPromise) {
        threeModulesPromise = Promise.all([
            import("https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js"),
            import("https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/OrbitControls.js"),
            import("https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js"),
        ]).then(([THREE, controlsModule, loaderModule]) => ({
            GLTFLoader: loaderModule.GLTFLoader,
            OrbitControls: controlsModule.OrbitControls,
            THREE,
        }));
    }

    return threeModulesPromise;
};

const frameObject = (THREE, camera, controls, object) => {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const distance = (maxDimension / (2 * Math.tan((camera.fov * Math.PI) / 360))) * 1.85;

    object.position.sub(center);
    camera.position.set(distance * 0.18, distance * 1.45, distance * 0.42);
    camera.near = Math.max(distance / 100, 0.01);
    camera.far = distance * 100;
    camera.updateProjectionMatrix();

    controls.target.set(0, 0, 0);
    controls.minDistance = distance * 0.25;
    controls.maxDistance = distance * 6;
    controls.update();
};

const disposeMaterial = (material) => {
    Object.values(material).forEach((value) => {
        if (value?.isTexture) {
            value.dispose();
        }
    });

    material.dispose();
};

const disposeObject = (object) => {
    object.traverse((child) => {
        if (child.geometry) {
            child.geometry.dispose();
        }

        if (Array.isArray(child.material)) {
            child.material.forEach(disposeMaterial);
        } else if (child.material) {
            disposeMaterial(child.material);
        }
    });
};

const disposeViewer = (viewer) => {
    if (!viewer || viewer.isDisposed) {
        return;
    }

    viewer.isDisposed = true;
    cancelAnimationFrame(viewer.animationFrame);
    viewer.resizeObserver?.disconnect();
    viewer.controls?.dispose();

    if (viewer.model) {
        disposeObject(viewer.model);
        viewer.scene.remove(viewer.model);
    }

    viewer.renderer?.dispose();
    viewer.renderer?.forceContextLoss();
    viewer.renderer?.domElement.remove();
    activeViewers.delete(viewer);
};

const createViewerStage = (isModal = false) => {
    const stage = document.createElement("div");
    stage.className = isModal ? "model-preview model-preview--modal" : "model-preview";
    stage.setAttribute("aria-label", "Interactive 3D model preview");
    stage.innerHTML = '<p class="model-preview__status" data-model-status>Loading 3D model...</p>';

    return stage;
};

const startViewer = async (stage, modelSource) => {
    const status = stage.querySelector("[data-model-status]");

    let THREE;
    let OrbitControls;
    let GLTFLoader;

    try {
        ({ THREE, OrbitControls, GLTFLoader } = await loadThreeModules());
    } catch {
        status.textContent = "The 3D viewer could not be loaded. Please check your internet connection and try again.";
        return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const controls = new OrbitControls(camera, renderer.domElement);

    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.maxHeight = "100%";
    stage.appendChild(renderer.domElement);

    scene.background = null;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa7b0, 2.4));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.1);
    fillLight.position.set(-4, 2, -3);
    scene.add(fillLight);

    const resize = () => {
        const { width, height } = stage.getBoundingClientRect();

        if (width === 0 || height === 0) {
            return;
        }

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);

    const viewer = {
        animationFrame: null,
        controls,
        isDisposed: false,
        model: null,
        renderer,
        resizeObserver,
        scene,
    };

    activeViewers.add(viewer);

    const animate = () => {
        if (viewer.isDisposed) {
            return;
        }

        controls.update();
        renderer.render(scene, camera);
        viewer.animationFrame = requestAnimationFrame(animate);
    };

    resize();

    const loader = new GLTFLoader();
    loader.setCrossOrigin("anonymous");

    loader.load(
        modelSource,
        (gltf) => {
            if (viewer.isDisposed) {
                disposeObject(gltf.scene);
                return;
            }

            viewer.model = gltf.scene;
            scene.add(gltf.scene);
            frameObject(THREE, camera, controls, gltf.scene);
            status?.remove();
        },
        undefined,
        (error) => {
            if (status && !viewer.isDisposed) {
                status.textContent = "The 3D model could not be loaded. Check that the GitHub Release asset is public and can be loaded by this website.";
                console.error("3D model load failed:", modelSource, error);
            }
        },
    );

    animate();

    return viewer;
};

modelOpenButtons.forEach((button) => {
    button.addEventListener("click", () => openModelModal(button));
});

window.addEventListener("beforeunload", () => {
    activeViewers.forEach(disposeViewer);
});

const createModelModal = (title) => {
    const modal = document.createElement("div");
    modal.className = "model-viewer-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", title || "Interactive 3D model preview");
    modal.innerHTML = `
        <div class="model-viewer-modal__dialog">
            <div class="model-viewer-modal__bar">
                <h2>${title || "Interactive 3D Model"}</h2>
                <button class="model-viewer-modal__close" type="button" aria-label="Close 3D preview">&times;</button>
            </div>
        </div>
    `;

    const dialog = modal.querySelector(".model-viewer-modal__dialog");
    const stage = createViewerStage(true);
    dialog.appendChild(stage);
    document.body.appendChild(modal);

    return {
        closeButton: modal.querySelector(".model-viewer-modal__close"),
        modal,
        stage,
    };
};

const closeModelModal = () => {
    if (!activeModal) {
        return;
    }

    disposeViewer(activeModal.viewer);
    activeModal.modal.remove();
    activeModal.trigger?.focus();
    activeModal = null;
    document.body.style.overflow = "";
};

const openModelModal = async (button) => {
    const modelSource = button.dataset.modelSrc;

    if (!modelSource) {
        return;
    }

    closeModelModal();

    const modalParts = createModelModal(button.dataset.modelTitle);
    activeModal = {
        ...modalParts,
        trigger: button,
        viewer: null,
    };

    document.body.style.overflow = "hidden";
    modalParts.closeButton.focus();
    modalParts.closeButton.addEventListener("click", closeModelModal);
    modalParts.modal.addEventListener("click", (event) => {
        if (event.target === modalParts.modal) {
            closeModelModal();
        }
    });

    const viewer = await startViewer(modalParts.stage, modelSource);

    if (activeModal?.modal === modalParts.modal) {
        activeModal.viewer = viewer;
    } else {
        disposeViewer(viewer);
    }
};

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeModelModal();
    }
});
