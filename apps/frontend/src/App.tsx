import { Outlet } from 'react-router-dom'
import ErrorWrapper from './pages/Error'

function App() {
  return (
    <ErrorWrapper>
    <div className="app-shell">
      <main>
        <Outlet /> 
      </main>
    </div>
    </ErrorWrapper>
  )
}

export default App