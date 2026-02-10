import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Shell } from '@/components/Shell'
import { Dashboard } from '@/pages/Dashboard'
import { Ingestion } from '@/pages/Ingestion'
import { Segmentation } from '@/pages/Segmentation'
import { Destinations } from '@/pages/Destinations'
import { Schemas } from '@/pages/Schemas'
import { Profiles } from '@/pages/Profiles'
import { Identities } from '@/pages/Identities'
import { QueryService } from '@/pages/QueryService'
import { Batches } from '@/pages/Batches'
import { Flows } from '@/pages/Flows'
import { Configuration } from '@/pages/Configuration'
import { Settings } from '@/pages/Settings'
import { AuditLog } from '@/pages/AuditLog'
import { Sandboxes } from '@/pages/Sandboxes'
import { PrivacyGovernance } from '@/pages/PrivacyGovernance'
import { EntityExplorer } from '@/components/EntityExplorer'
import { UtilitiesPanel } from '@/components/utilities/UtilitiesPanel'
import '@/styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <HashRouter>
            <Shell>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/explorer" element={<EntityExplorer />} />
                    <Route path="/ingestion" element={<Ingestion />} />
                    <Route path="/segmentation" element={<Segmentation />} />
                    <Route path="/destinations" element={<Destinations />} />
                    <Route path="/schemas" element={<Schemas />} />
                    <Route path="/profiles" element={<Profiles />} />
                    <Route path="/identities" element={<Identities />} />
                    <Route path="/query-service" element={<QueryService />} />
                    <Route path="/batches" element={<Batches />} />
                    <Route path="/flows" element={<Flows />} />
                    <Route path="/audit-log" element={<AuditLog />} />
                    <Route path="/sandboxes" element={<Sandboxes />} />
                    <Route path="/privacy-governance" element={<PrivacyGovernance />} />
                    <Route path="/configuration" element={<Configuration />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/utilities" element={<UtilitiesPanel />} />
                </Routes>
            </Shell>
        </HashRouter>
    </React.StrictMode>
)
