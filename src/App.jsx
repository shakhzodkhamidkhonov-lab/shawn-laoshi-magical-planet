import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Physics, RigidBody, CapsuleCollider } from '@react-three/rapier'
import * as THREE from 'three'

const ROOM_MIN_X = -3.55
const ROOM_MAX_X = 3.55
const ROOM_MIN_Z = -3.55

function Character({ inputRef, positionRef, headingRef }) {
  const body = useRef()
  const characterVisual = useRef()

  const heading = useRef(0)
  const jumpWasPressed = useRef(false)

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        [
          'KeyW',
          'KeyA',
          'KeyS',
          'KeyD',
          'KeyQ',
          'KeyE',
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'Space',
          'ShiftLeft',
          'ShiftRight',
          'KeyC',
        ].includes(event.code)
      ) {
        event.preventDefault()
      }

      if (event.code === 'KeyW' || event.code === 'ArrowUp') {
        inputRef.current.forward = true
      }

      if (event.code === 'KeyS' || event.code === 'ArrowDown') {
        inputRef.current.backward = true
      }

      if (event.code === 'KeyA' || event.code === 'ArrowLeft') {
        inputRef.current.turnLeft = true
      }

      if (event.code === 'KeyD' || event.code === 'ArrowRight') {
        inputRef.current.turnRight = true
      }

      if (event.code === 'KeyQ') {
        inputRef.current.strafeLeft = true
      }

      if (event.code === 'KeyE') {
        inputRef.current.strafeRight = true
      }

      if (
        event.code === 'ShiftLeft' ||
        event.code === 'ShiftRight'
      ) {
        inputRef.current.run = true
      }

      if (event.code === 'Space' && !event.repeat) {
        inputRef.current.jumpRequested = true
      }

      if (event.code === 'KeyC' && !event.repeat) {
        inputRef.current.recenterCamera = true
      }
    }

    const handleKeyUp = (event) => {
      if (event.code === 'KeyW' || event.code === 'ArrowUp') {
        inputRef.current.forward = false
      }

      if (event.code === 'KeyS' || event.code === 'ArrowDown') {
        inputRef.current.backward = false
      }

      if (event.code === 'KeyA' || event.code === 'ArrowLeft') {
        inputRef.current.turnLeft = false
      }

      if (event.code === 'KeyD' || event.code === 'ArrowRight') {
        inputRef.current.turnRight = false
      }

      if (event.code === 'KeyQ') {
        inputRef.current.strafeLeft = false
      }

      if (event.code === 'KeyE') {
        inputRef.current.strafeRight = false
      }

      if (
        event.code === 'ShiftLeft' ||
        event.code === 'ShiftRight'
      ) {
        inputRef.current.run = false
      }

      if (event.code === 'Space') {
        jumpWasPressed.current = false
      }
    }

    const clearControls = () => {
      inputRef.current.forward = false
      inputRef.current.backward = false
      inputRef.current.turnLeft = false
      inputRef.current.turnRight = false
      inputRef.current.strafeLeft = false
      inputRef.current.strafeRight = false
      inputRef.current.run = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', clearControls)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', clearControls)
    }
  }, [inputRef])

  useFrame((_, delta) => {
    if (!body.current) return

    const controls = inputRef.current

    const walkingSpeed = 2.8
    const runningSpeed = 5
    const backwardMultiplier = 0.72
    const strafeMultiplier = 0.8
    const turnSpeed = controls.run ? 2.7 : 2.25

    if (controls.turnLeft) {
      heading.current -= turnSpeed * delta
    }

    if (controls.turnRight) {
      heading.current += turnSpeed * delta
    }

    headingRef.current = heading.current

    const forward = new THREE.Vector3(
      Math.sin(heading.current),
      0,
      -Math.cos(heading.current),
    )

    const right = new THREE.Vector3(
      Math.cos(heading.current),
      0,
      Math.sin(heading.current),
    )

    const movement = new THREE.Vector3()

    if (controls.forward) {
      movement.add(forward)
    }

    if (controls.backward) {
      movement.addScaledVector(
        forward,
        -backwardMultiplier,
      )
    }

    if (controls.strafeLeft) {
      movement.addScaledVector(
        right,
        -strafeMultiplier,
      )
    }

    if (controls.strafeRight) {
      movement.addScaledVector(
        right,
        strafeMultiplier,
      )
    }

    const speed = controls.run
      ? runningSpeed
      : walkingSpeed

    if (movement.lengthSq() > 1) {
      movement.normalize()
    }

    movement.multiplyScalar(speed)

    const velocity = body.current.linvel()

    const horizontalBlend =
      1 - Math.exp(-12 * delta)

    const smoothX = THREE.MathUtils.lerp(
      velocity.x,
      movement.x,
      horizontalBlend,
    )

    const smoothZ = THREE.MathUtils.lerp(
      velocity.z,
      movement.z,
      horizontalBlend,
    )

    let verticalVelocity = velocity.y

    const position = body.current.translation()

    const isOnFloor =
      position.y <= 1.02 &&
      Math.abs(velocity.y) < 0.3

    if (
      controls.jumpRequested &&
      !jumpWasPressed.current &&
      isOnFloor
    ) {
      verticalVelocity = 5.2
      jumpWasPressed.current = true
    }

    controls.jumpRequested = false

    body.current.setLinvel(
      {
        x: smoothX,
        y: verticalVelocity,
        z: smoothZ,
      },
      true,
    )

    if (characterVisual.current) {
      characterVisual.current.rotation.y =
        -heading.current
    }

    positionRef.current.set(
      position.x,
      position.y,
      position.z,
    )
  })

  return (
    <RigidBody
      ref={body}
      position={[0, 1.2, 1.5]}
      colliders={false}
      enabledRotations={[false, false, false]}
      friction={1}
      linearDamping={0.4}
    >
      <CapsuleCollider args={[0.5, 0.35]} />

      <group ref={characterVisual}>
        <mesh castShadow>
          <capsuleGeometry args={[0.35, 1, 8, 16]} />
          <meshStandardMaterial color="#4169e1" />
        </mesh>

        <mesh
          position={[0, 0.95, 0]}
          castShadow
        >
          <sphereGeometry args={[0.3, 24, 24]} />
          <meshStandardMaterial color="#f0c7a5" />
        </mesh>

        <mesh
          position={[0, 0.95, -0.29]}
          castShadow
        >
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#c98968" />
        </mesh>
      </group>
    </RigidBody>
  )
}

function ThirdPersonCamera({
  inputRef,
  positionRef,
  headingRef,
}) {
  const { camera, gl } = useThree()

  const yawOffset = useRef(0)
  const lookPitch = useRef(0)

  const orbitElevation = 0.4

  const distance = useRef(4)
  const targetDistance = useRef(4)

  const collisionScale = useRef(1)

  const dragging = useRef(false)

  const lastMouse = useRef({
    x: 0,
    y: 0,
  })

  const lastTouch = useRef({
    x: 0,
    y: 0,
  })

  const lastPinchDistance = useRef(null)

  const smoothedTarget = useRef(
    new THREE.Vector3(0, 1.9, 1.5),
  )

  useEffect(() => {
    const element = gl.domElement

    element.style.touchAction = 'none'

    const handleContextMenu = (event) => {
      event.preventDefault()
    }

    const handleMouseDown = (event) => {
      if (
        event.button !== 0 &&
        event.button !== 2
      ) {
        return
      }

      dragging.current = true

      lastMouse.current = {
        x: event.clientX,
        y: event.clientY,
      }
    }

    const handleMouseMove = (event) => {
      if (!dragging.current) return

      const dx =
        event.clientX -
        lastMouse.current.x

      const dy =
        event.clientY -
        lastMouse.current.y

      yawOffset.current -= dx * 0.005

      lookPitch.current =
        THREE.MathUtils.clamp(
          lookPitch.current -
            dy * 0.006,
          -1.15,
          1.65,
        )

      lastMouse.current = {
        x: event.clientX,
        y: event.clientY,
      }
    }

    const handleMouseUp = () => {
      dragging.current = false
    }

    const handleWheel = (event) => {
      event.preventDefault()

      let wheelAmount = event.deltaY

      if (event.deltaMode === 1) {
        wheelAmount *= 16
      }

      if (event.deltaMode === 2) {
        wheelAmount *= window.innerHeight
      }

      targetDistance.current =
        THREE.MathUtils.clamp(
          targetDistance.current +
            wheelAmount * 0.012,
          2,
          9,
        )
    }

    const getTouchDistance = (touches) => {
      const dx =
        touches[0].clientX -
        touches[1].clientX

      const dy =
        touches[0].clientY -
        touches[1].clientY

      return Math.sqrt(
        dx * dx + dy * dy,
      )
    }

    const handleTouchStart = (event) => {
      event.preventDefault()

      if (event.touches.length === 1) {
        lastTouch.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        }

        lastPinchDistance.current = null
      }

      if (event.touches.length === 2) {
        lastPinchDistance.current =
          getTouchDistance(event.touches)
      }
    }

    const handleTouchMove = (event) => {
      event.preventDefault()

      if (event.touches.length === 1) {
        const touch = event.touches[0]

        const dx =
          touch.clientX -
          lastTouch.current.x

        const dy =
          touch.clientY -
          lastTouch.current.y

        yawOffset.current -= dx * 0.006

        lookPitch.current =
          THREE.MathUtils.clamp(
            lookPitch.current -
              dy * 0.007,
            -1.15,
            1.65,
          )

        lastTouch.current = {
          x: touch.clientX,
          y: touch.clientY,
        }
      }

      if (event.touches.length === 2) {
        const currentPinchDistance =
          getTouchDistance(event.touches)

        if (lastPinchDistance.current !== null) {
          const difference =
            currentPinchDistance -
            lastPinchDistance.current

          targetDistance.current =
            THREE.MathUtils.clamp(
              targetDistance.current -
                difference * 0.025,
              2,
              9,
            )
        }

        lastPinchDistance.current =
          currentPinchDistance
      }
    }

    const handleTouchEnd = () => {
      lastPinchDistance.current = null
    }

    element.addEventListener(
      'contextmenu',
      handleContextMenu,
    )

    element.addEventListener(
      'mousedown',
      handleMouseDown,
    )

    window.addEventListener(
      'mousemove',
      handleMouseMove,
    )

    window.addEventListener(
      'mouseup',
      handleMouseUp,
    )

    element.addEventListener(
      'wheel',
      handleWheel,
      {
        passive: false,
      },
    )

    element.addEventListener(
      'touchstart',
      handleTouchStart,
      {
        passive: false,
      },
    )

    element.addEventListener(
      'touchmove',
      handleTouchMove,
      {
        passive: false,
      },
    )

    element.addEventListener(
      'touchend',
      handleTouchEnd,
    )

    return () => {
      element.removeEventListener(
        'contextmenu',
        handleContextMenu,
      )

      element.removeEventListener(
        'mousedown',
        handleMouseDown,
      )

      window.removeEventListener(
        'mousemove',
        handleMouseMove,
      )

      window.removeEventListener(
        'mouseup',
        handleMouseUp,
      )

      element.removeEventListener(
        'wheel',
        handleWheel,
      )

      element.removeEventListener(
        'touchstart',
        handleTouchStart,
      )

      element.removeEventListener(
        'touchmove',
        handleTouchMove,
      )

      element.removeEventListener(
        'touchend',
        handleTouchEnd,
      )
    }
  }, [gl])

  useFrame((_, delta) => {
    if (inputRef.current.recenterCamera) {
      yawOffset.current = 0
      lookPitch.current = 0
      targetDistance.current = 4

      inputRef.current.recenterCamera = false
    }

    const zoomBlend =
      1 - Math.exp(-20 * delta)

    distance.current =
      THREE.MathUtils.lerp(
        distance.current,
        targetDistance.current,
        zoomBlend,
      )

    const rawTarget = new THREE.Vector3(
      positionRef.current.x,
      positionRef.current.y + 0.7,
      positionRef.current.z,
    )

    const targetBlend =
      1 - Math.exp(-12 * delta)

    smoothedTarget.current.lerp(
      rawTarget,
      targetBlend,
    )

    const target = smoothedTarget.current

    const cameraYaw =
      headingRef.current +
      yawOffset.current

    const normalHorizontalDistance =
      Math.cos(orbitElevation) *
      distance.current

    const desiredHorizontalOffset =
      new THREE.Vector3(
        -Math.sin(cameraYaw) *
          normalHorizontalDistance,
        0,
        Math.cos(cameraYaw) *
          normalHorizontalDistance,
      )

    let safeScale = 1

    const safetyMargin = 0.2

    const minX =
      ROOM_MIN_X + safetyMargin

    const maxX =
      ROOM_MAX_X - safetyMargin

    const minZ =
      ROOM_MIN_Z + safetyMargin

    if (desiredHorizontalOffset.x > 0) {
      const available =
        maxX - target.x

      safeScale = Math.min(
        safeScale,
        available /
          desiredHorizontalOffset.x,
      )
    }

    if (desiredHorizontalOffset.x < 0) {
      const available =
        minX - target.x

      safeScale = Math.min(
        safeScale,
        available /
          desiredHorizontalOffset.x,
      )
    }

    if (desiredHorizontalOffset.z < 0) {
      const available =
        minZ - target.z

      safeScale = Math.min(
        safeScale,
        available /
          desiredHorizontalOffset.z,
      )
    }

    safeScale =
      THREE.MathUtils.clamp(
        safeScale,
        0.05,
        1,
      )

    const collisionBlend =
      1 - Math.exp(-8 * delta)

    collisionScale.current =
      THREE.MathUtils.lerp(
        collisionScale.current,
        safeScale,
        collisionBlend,
      )

    const horizontalDistance =
      normalHorizontalDistance *
      collisionScale.current

    const preservedVerticalDistance =
      Math.sqrt(
        Math.max(
          0,
          distance.current *
            distance.current -
            horizontalDistance *
              horizontalDistance,
        ),
      )

    const normalVerticalDistance =
      Math.sin(orbitElevation) *
      distance.current

    const verticalDistance =
      Math.max(
        normalVerticalDistance,
        preservedVerticalDistance,
      )

    const horizontalOffset =
      new THREE.Vector3(
        -Math.sin(cameraYaw) *
          horizontalDistance,
        0,
        Math.cos(cameraYaw) *
          horizontalDistance,
      )

    const desiredPosition =
      target
        .clone()
        .add(horizontalOffset)

    desiredPosition.y =
      target.y +
      verticalDistance

    desiredPosition.y =
      THREE.MathUtils.clamp(
        desiredPosition.y,
        1.15,
        12,
      )

    const cameraBlend =
      1 - Math.exp(-10 * delta)

    camera.position.lerp(
      desiredPosition,
      cameraBlend,
    )

    const lookDirection =
      target
        .clone()
        .sub(camera.position)
        .normalize()

    const worldUp =
      new THREE.Vector3(0, 1, 0)

    const rightAxis =
      new THREE.Vector3()
        .crossVectors(
          lookDirection,
          worldUp,
        )

    if (rightAxis.lengthSq() > 0.00001) {
      rightAxis.normalize()

      lookDirection.applyAxisAngle(
        rightAxis,
        lookPitch.current,
      )
    }

    const lookPoint =
      camera.position
        .clone()
        .add(
          lookDirection.multiplyScalar(
            20,
          ),
        )

    camera.lookAt(lookPoint)
  })

  return null
}

function Room() {
  return (
    <>
      <RigidBody
        type="fixed"
        colliders="cuboid"
      >
        <mesh
          position={[0, 0, 0]}
          receiveShadow
        >
          <boxGeometry args={[8, 0.2, 8]} />
          <meshStandardMaterial color="#d8c3a5" />
        </mesh>
      </RigidBody>

      <RigidBody
        type="fixed"
        colliders="cuboid"
      >
        <mesh
          position={[0, 2, -4]}
          receiveShadow
        >
          <boxGeometry args={[8, 4, 0.2]} />
          <meshStandardMaterial color="#f3eadc" />
        </mesh>
      </RigidBody>

      <RigidBody
        type="fixed"
        colliders="cuboid"
      >
        <mesh
          position={[-4, 2, 0]}
          receiveShadow
        >
          <boxGeometry args={[0.2, 4, 8]} />
          <meshStandardMaterial color="#eee3d3" />
        </mesh>
      </RigidBody>

      <RigidBody
        type="fixed"
        colliders="cuboid"
      >
        <mesh
          position={[4, 2, 0]}
          receiveShadow
        >
          <boxGeometry args={[0.2, 4, 8]} />
          <meshStandardMaterial color="#eee3d3" />
        </mesh>
      </RigidBody>

      <RigidBody
        type="fixed"
        colliders="cuboid"
      >
        <mesh
          position={[0, 1, -1.8]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[2.5, 0.2, 1]} />
          <meshStandardMaterial color="#8b5e3c" />
        </mesh>

        <mesh
          position={[-1, 0.5, -1.8]}
          castShadow
        >
          <boxGeometry args={[0.2, 1, 0.2]} />
          <meshStandardMaterial color="#6f472f" />
        </mesh>

        <mesh
          position={[1, 0.5, -1.8]}
          castShadow
        >
          <boxGeometry args={[0.2, 1, 0.2]} />
          <meshStandardMaterial color="#6f472f" />
        </mesh>
      </RigidBody>
    </>
  )
}

function Scene({ inputRef }) {
  const characterPosition = useRef(
    new THREE.Vector3(
      0,
      1.2,
      1.5,
    ),
  )

  const characterHeading = useRef(0)

  return (
    <>
      <color
        attach="background"
        args={['#b9ddf5']}
      />

      <ambientLight intensity={1.2} />

      <directionalLight
        position={[4, 8, 5]}
        intensity={2}
        castShadow
      />

      <Physics gravity={[0, -9.81, 0]}>
        <Room />

        <Character
          inputRef={inputRef}
          positionRef={characterPosition}
          headingRef={characterHeading}
        />
      </Physics>

      <ThirdPersonCamera
        inputRef={inputRef}
        positionRef={characterPosition}
        headingRef={characterHeading}
      />
    </>
  )
}

function HoldButton({
  children,
  onPress,
  onRelease,
  style,
}) {
  return (
    <button
      type="button"
      onPointerDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onPress()
      }}
      onPointerUp={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onRelease()
      }}
      onPointerCancel={onRelease}
      onPointerLeave={onRelease}
      style={{
        width: 58,
        height: 58,
        borderRadius: '50%',
        border:
          '1px solid rgba(255,255,255,0.45)',
        background:
          'rgba(20, 28, 45, 0.55)',
        color: 'white',
        fontSize: 24,
        fontWeight: 700,
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter:
          'blur(6px)',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

function MobileControls({
  inputRef,
}) {
  const [isTouchDevice] =
    useState(() => {
      if (typeof window === 'undefined') {
        return false
      }

      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
      )
    })

  if (!isTouchDevice) {
    return null
  }

  const setControl = (
    name,
    value,
  ) => {
    inputRef.current[name] = value
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: 18,
          bottom: 24,
          zIndex: 20,
          width: 190,
          height: 180,
          pointerEvents: 'none',
        }}
      >
        <HoldButton
          onPress={() =>
            setControl(
              'forward',
              true,
            )
          }
          onRelease={() =>
            setControl(
              'forward',
              false,
            )
          }
          style={{
            position: 'absolute',
            left: 66,
            top: 0,
            pointerEvents: 'auto',
          }}
        >
          ▲
        </HoldButton>

        <HoldButton
          onPress={() =>
            setControl(
              'turnLeft',
              true,
            )
          }
          onRelease={() =>
            setControl(
              'turnLeft',
              false,
            )
          }
          style={{
            position: 'absolute',
            left: 0,
            top: 62,
            pointerEvents: 'auto',
          }}
        >
          ◀
        </HoldButton>

        <HoldButton
          onPress={() =>
            setControl(
              'backward',
              true,
            )
          }
          onRelease={() =>
            setControl(
              'backward',
              false,
            )
          }
          style={{
            position: 'absolute',
            left: 66,
            top: 62,
            pointerEvents: 'auto',
          }}
        >
          ▼
        </HoldButton>

        <HoldButton
          onPress={() =>
            setControl(
              'turnRight',
              true,
            )
          }
          onRelease={() =>
            setControl(
              'turnRight',
              false,
            )
          }
          style={{
            position: 'absolute',
            left: 132,
            top: 62,
            pointerEvents: 'auto',
          }}
        >
          ▶
        </HoldButton>
      </div>

      <div
        style={{
          position: 'fixed',
          right: 20,
          bottom: 28,
          zIndex: 20,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-end',
        }}
      >
        <HoldButton
          onPress={() =>
            setControl(
              'run',
              true,
            )
          }
          onRelease={() =>
            setControl(
              'run',
              false,
            )
          }
          style={{
            width: 66,
            height: 66,
            fontSize: 15,
          }}
        >
          RUN
        </HoldButton>

        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()

            inputRef.current.jumpRequested =
              true
          }}
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            border:
              '1px solid rgba(255,255,255,0.5)',
            background:
              'rgba(65, 105, 225, 0.72)',
            color: 'white',
            fontSize: 15,
            fontWeight: 700,
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter:
              'blur(6px)',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          JUMP
        </button>
      </div>
    </>
  )
}

function App() {
  const inputRef = useRef({
    forward: false,
    backward: false,
    turnLeft: false,
    turnRight: false,
    strafeLeft: false,
    strafeRight: false,
    run: false,
    jumpRequested: false,
    recenterCamera: false,
  })

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: '#cfe8ff',
        position: 'relative',
      }}
    >
      <Canvas
        shadows
        camera={{
          position: [0, 3.5, 5],
          fov: 65,
          near: 0.1,
          far: 100,
        }}
        style={{
          width: '100%',
          height: '100%',
          touchAction: 'none',
        }}
      >
        <Scene inputRef={inputRef} />
      </Canvas>

      <MobileControls
        inputRef={inputRef}
      />
    </div>
  )
}

export default App