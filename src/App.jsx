import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics, RigidBody, CapsuleCollider } from '@react-three/rapier'

function Character() {
  const body = useRef()
  const [keys, setKeys] = useState({})

  useEffect(() => {
    const handleKeyDown = (event) => {
      setKeys((current) => ({
        ...current,
        [event.code]: true,
      }))
    }

    const handleKeyUp = (event) => {
      setKeys((current) => ({
        ...current,
        [event.code]: false,
      }))
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame(() => {
    if (!body.current) return

    const speed = 3

    let x = 0
    let z = 0

    if (keys.KeyW || keys.ArrowUp) z -= speed
    if (keys.KeyS || keys.ArrowDown) z += speed
    if (keys.KeyA || keys.ArrowLeft) x -= speed
    if (keys.KeyD || keys.ArrowRight) x += speed

    const currentVelocity = body.current.linvel()

    body.current.setLinvel(
      {
        x,
        y: currentVelocity.y,
        z,
      },
      true,
    )
  })

  return (
    <RigidBody
      ref={body}
      position={[0, 1.2, 1.5]}
      colliders={false}
      enabledRotations={[false, false, false]}
      friction={1}
    >
      <CapsuleCollider args={[0.5, 0.35]} />

      {/* Temporary body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.35, 1, 8, 16]} />
        <meshStandardMaterial color="#4169e1" />
      </mesh>

      {/* Temporary head */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshStandardMaterial color="#f0c7a5" />
      </mesh>
    </RigidBody>
  )
}

function Room() {
  return (
    <>
      {/* Floor */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[8, 0.2, 8]} />
          <meshStandardMaterial color="#d8c3a5" />
        </mesh>
      </RigidBody>

      {/* Back wall */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 2, -4]} receiveShadow>
          <boxGeometry args={[8, 4, 0.2]} />
          <meshStandardMaterial color="#f3eadc" />
        </mesh>
      </RigidBody>

      {/* Left wall */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-4, 2, 0]} receiveShadow>
          <boxGeometry args={[0.2, 4, 8]} />
          <meshStandardMaterial color="#eee3d3" />
        </mesh>
      </RigidBody>

      {/* Right wall */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[4, 2, 0]} receiveShadow>
          <boxGeometry args={[0.2, 4, 8]} />
          <meshStandardMaterial color="#eee3d3" />
        </mesh>
      </RigidBody>

      {/* Table */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 1, -1.8]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 0.2, 1]} />
          <meshStandardMaterial color="#8b5e3c" />
        </mesh>

        <mesh position={[-1, 0.5, -1.8]} castShadow>
          <boxGeometry args={[0.2, 1, 0.2]} />
          <meshStandardMaterial color="#6f472f" />
        </mesh>

        <mesh position={[1, 0.5, -1.8]} castShadow>
          <boxGeometry args={[0.2, 1, 0.2]} />
          <meshStandardMaterial color="#6f472f" />
        </mesh>
      </RigidBody>
    </>
  )
}

function App() {
  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        background: '#cfe8ff',
      }}
    >
      <Canvas
        shadows
        camera={{
          position: [5, 4, 7],
          fov: 50,
        }}
      >
        <color attach="background" args={['#b9ddf5']} />

        <ambientLight intensity={1.2} />

        <directionalLight
          position={[4, 8, 5]}
          intensity={2}
          castShadow
        />

        <Physics gravity={[0, -9.81, 0]}>
          <Room />
          <Character />
        </Physics>

        <OrbitControls
          target={[0, 1.5, 0]}
          enableDamping
          minDistance={3}
          maxDistance={14}
        />
      </Canvas>
    </div>
  )
}

export default App