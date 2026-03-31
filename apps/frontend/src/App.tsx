import { Outlet } from 'react-router-dom'

function App() {
  return (
    <div className="app-shell overflow-x-hidden max-w-full">
      <main>
        <Outlet /> 
      </main>
    </div>
  )
}

export default App