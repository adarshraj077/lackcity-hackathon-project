import { useLocation } from 'react-router-dom'
import TriageMapRouter from './TriageMapRouter'

export default function Maps({ isDarkMode = false }) {
    // Get triage result and selected facility passed via navigation state
    const location = useLocation()
    const triageResult = location.state?.triageResult
    const selectedFacility = location.state?.selectedFacility

    return <TriageMapRouter triageResult={triageResult} selectedFacility={selectedFacility} isDarkMode={isDarkMode} />
}