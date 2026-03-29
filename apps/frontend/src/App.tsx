import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className='pt-25 pb-20'>
        <Outlet /> 
      </main>
    </div>
  )
}

export default App