import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import UserJourney from './pages/UserJourney'
import TicketProbability from './pages/TicketProbability'
import PoolSimulator from './pages/PoolSimulator'
import PrizeAccounting from './pages/PrizeAccounting'
import FeeShareSimulator from './pages/FeeShareSimulator'
import TermSheet from './pages/TermSheet'

export default function App() {
  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main className="lg:ml-56 pb-20 lg:pb-8 px-4 lg:px-8 pt-6">
        <Routes>
          <Route path="/" element={<UserJourney />} />
          <Route path="/probability" element={<TicketProbability />} />
          <Route path="/pool" element={<PoolSimulator />} />
          <Route path="/accounting" element={<PrizeAccounting />} />
          <Route path="/feeshare" element={<FeeShareSimulator />} />
          <Route path="/termsheet" element={<TermSheet />} />
        </Routes>
      </main>
    </div>
  )
}
