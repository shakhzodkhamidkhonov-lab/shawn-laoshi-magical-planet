import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function Room() {
  return (
    <>
      {/* Floor */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[8, 0.2, 8]} />
        <meshStandardMaterial color="#d8c3a5" />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 2, -4]}>
        <boxGeometry args={[8, 4, 0.2]} />
        <meshStandardMaterial color="#f3eadc" />
      </mesh>

      {/* Left wall */}
      <mesh position={[-4, 2, 0]}>
        <boxGeometry args={[0.2, 4, 8]} />
        <meshStandardMaterial color="#eee3d3" />
      </mesh>

      {/* Right wall */}
      <mesh position={[4, 2, 0]}>
        <boxGeometry args={[0.2, 4, 8]} />
        <meshStandardMaterial color="#eee3d3" />
      </mesh>

      {/* Simple table */}
      <mesh position={[0, 1, -1.8]}>
        <boxGeometry args={[2.5, 0.2, 1]} />
        <meshStandardMaterial color="#8b5e3c" />
      </mesh>

      <mesh position={[-1, 0.5, -1.8]}>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshStandardMaterial color="#6f472f" />
      </mesh>

      <mesh position={[1, 0.5, -1.8]}>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshStandardMaterial color="#6f472f" />
      </mesh>
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

        <Room />

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