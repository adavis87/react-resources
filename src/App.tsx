import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ConceptsPage } from './pages/ConceptsPage'
import { PatternsPage } from './pages/PatternsPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/concepts" replace />} />
        <Route path="/concepts/:slug?" element={<ConceptsPage />} />
        <Route path="/patterns/:slug?" element={<PatternsPage />} />
        <Route path="*" element={<Navigate to="/concepts" replace />} />
      </Routes>
    </HashRouter>
  )
}
