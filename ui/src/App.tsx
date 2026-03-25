import { TraceList } from './components/TraceList'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>InfoGen Traces</h1>
        <p>Agent Execution Observability</p>
      </header>
      <main className="app-main">
        <TraceList />
      </main>
    </div>
  )
}

export default App
