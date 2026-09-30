import React, { useState, useEffect, useCallback } from 'react';
import type { 
  GraphData, 
  GraphNode, 
  AnalyticsSummary, 
  SplinkCandidate, 
  BSACertificate, 
  AuditBlock,
  IntelligenceDossier,
  LiveStreamEvent
} from './types/graph';
import { 
  fetchGraphData, 
  fetchTemporalGraph, 
  fetchAnalytics, 
  loadDemoScenario, 
  loadFunScenario,
  loadOperationRakshak,
  clearGraph, 
  fetchFusionCandidates, 
  executeMerge, 
  fetchAuditLedger, 
  verifyAuditLedger, 
  fetchBSACertificate, 
  uploadEvidenceFile,
  fetchDossierReport,
  triggerSimulatedIntercept,
  API_BASE
} from './services/api';
import { TopNav } from './components/TopNav';
import { GraphCanvas } from './components/GraphCanvas';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { TimeSlider } from './components/TimeSlider';
import { BSACertificateModal } from './components/BSACertificateModal';
import { AuditLedgerModal } from './components/AuditLedgerModal';
import { LiveStreamTicker } from './components/LiveStreamTicker';
import { DossierReportModal } from './components/DossierReportModal';
import { InvestigatorCopilot } from './components/InvestigatorCopilot';
import { GeoSpatialMapView } from './components/GeoSpatialMapView';
import { HiddenLinksModal } from './components/HiddenLinksModal';
import { NetworkPathfinderModal } from './components/NetworkPathfinderModal';
import { SyndicateHierarchyModal } from './components/SyndicateHierarchyModal';
import { ComplianceMatrixModal } from './components/ComplianceMatrixModal';
import { MultiSourceIngestModal } from './components/MultiSourceIngestModal';
import { LawfulInterceptionModal } from './components/LawfulInterceptionModal';
import { CryptoHawalaModal } from './components/CryptoHawalaModal';
import { DisruptionPlannerModal } from './components/DisruptionPlannerModal';
import { VASPAttributionModal } from './components/VASPAttributionModal';
import { AuthGate } from './components/AuthGate';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { InactivityLockModal } from './components/InactivityLockModal';
import type { OfficerSession } from './types/auth';
import { fetchCurrentSession, logoutOfficer } from './services/authApi';

export const App: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [], metadata: {} });
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [candidates, setCandidates] = useState<SplinkCandidate[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [auditVerified, setAuditVerified] = useState(true);
  const [auditBlocks, setAuditBlocks] = useState<AuditBlock[]>([]);
  const [bsaCertificate, setBsaCertificate] = useState<BSACertificate | null>(null);

  // Version 2.0 Real-Time Analytics & Dossier State
  const [streaming, setStreaming] = useState(true);
  const [latestEvent, setLatestEvent] = useState<LiveStreamEvent | null>(null);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierData, setDossierData] = useState<IntelligenceDossier | null>(null);

  // Version 3.0 & 4.0 Apex / Sovereign Feature State
  const [activeTab, setActiveTab] = useState<'graph' | 'gis'>('graph');
  const [showCopilot, setShowCopilot] = useState(false);
  const [showHiddenLinksModal, setShowHiddenLinksModal] = useState(false);
  const [showPathfinderModal, setShowPathfinderModal] = useState(false);
  const [showHierarchyModal, setShowHierarchyModal] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showIngestHubModal, setShowIngestHubModal] = useState(false);
  const [showInterceptionModal, setShowInterceptionModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showDisruptionModal, setShowDisruptionModal] = useState(false);
  const [showVASPModal, setShowVASPModal] = useState(false);
  const [vaspTargetWallet, setVaspTargetWallet] = useState<string>('TTsY1v6BpxvU9jP1k2L4wE8rT992p');
  const [agencyClearance, setAgencyClearance] = useState('MHA_APEX_COMMAND');

  // Sovereign Zero-Trust Authentication & Session State
  const [currentSession, setCurrentSession] = useState<OfficerSession | null>(() => {
    try {
      const saved = localStorage.getItem('crimegraph_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isManuallyLocked, setIsManuallyLocked] = useState(false);

  // Validate active session with backend on boot
  useEffect(() => {
    if (currentSession?.token) {
      fetchCurrentSession(currentSession.token)
        .then((res) => {
          if (res.authenticated) {
            setAgencyClearance(res.agency_code);
          }
        })
        .catch(() => {
          localStorage.removeItem('crimegraph_session');
          setCurrentSession(null);
        });
    }
  }, [currentSession?.token]);

  const handleAuthenticated = (session: OfficerSession) => {
    setCurrentSession(session);
    setAgencyClearance(session.agency_code);
    try {
      localStorage.setItem('crimegraph_session', JSON.stringify(session));
    } catch {}
    refreshAll(session.agency_code);
  };

  const handleLogout = async () => {
    if (currentSession?.token) {
      await logoutOfficer(currentSession.token);
    }
    localStorage.removeItem('crimegraph_session');
    setCurrentSession(null);
    setShowAdminModal(false);
    setIsManuallyLocked(false);
  };

  const handleAgencyClearanceChange = async (newAgency: string) => {
    setAgencyClearance(newAgency);
    setLoading(true);
    try {
      const gData = await fetchGraphData(newAgency);
      setGraphData(gData);
    } catch (err) {
      console.error('Error switching agency clearance:', err);
    } finally {
      setLoading(false);
    }
  };

  // Modals
  const [showBSAModal, setShowBSAModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Refresh all application state
  const refreshAll = useCallback(async (agency?: string) => {
    const targetAgency = agency || agencyClearance;
    try {
      const [gData, aData, fData, lData] = await Promise.all([
        fetchGraphData(targetAgency),
        fetchAnalytics(),
        fetchFusionCandidates(),
        fetchAuditLedger()
      ]);
      setGraphData(gData);
      setAnalytics(aData);
      setCandidates(fData);
      setAuditBlocks(lData);
    } catch (err) {
      console.error('Error refreshing state:', err);
    }
  }, [agencyClearance]);

  // Initial load: Load Operation Rakshak (NCRB Women Safety Priority)
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadOperationRakshak();
        await refreshAll();
        const v = await verifyAuditLedger();
        setAuditVerified(v.verified);
      } catch (err) {
        console.error('Failed to initialize scenario:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [refreshAll]);

  // Handlers
  const handleLoadDemo = async () => {
    setLoading(true);
    try {
      await loadDemoScenario();
      await refreshAll();
      setSelectedNode(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFun = async () => {
    setLoading(true);
    try {
      await loadFunScenario();
      await refreshAll();
      setSelectedNode(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadRakshak = async () => {
    setLoading(true);
    try {
      await loadOperationRakshak();
      await refreshAll();
      setSelectedNode(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    try {
      await clearGraph();
      await refreshAll();
      setSelectedNode(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async (canonicalId: string, duplicateId: string) => {
    setLoading(true);
    try {
      await executeMerge(canonicalId, duplicateId);
      await refreshAll();
      setSelectedNode(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (type: 'cdr' | 'bank' | 'fir', file: File) => {
    await uploadEvidenceFile(type, file);
    await refreshAll();
  };

  const handleTimeChange = async (startDate?: string, endDate?: string) => {
    try {
      const data = await fetchTemporalGraph(startDate, endDate);
      setGraphData(data);
    } catch (err) {
      console.error('Temporal error:', err);
    }
  };

  const handleOpenBSA = async () => {
    try {
      const cert = await fetchBSACertificate();
      setBsaCertificate(cert);
      setShowBSAModal(true);
    } catch (err) {
      console.error('Error loading BSA certificate:', err);
    }
  };

  const handleOpenAudit = async () => {
    try {
      const blocks = await fetchAuditLedger();
      setAuditBlocks(blocks);
      setShowAuditModal(true);
    } catch (err) {
      console.error('Error loading audit ledger:', err);
    }
  };

  const handleOpenDossier = async () => {
    setLoading(true);
    try {
      const d = await fetchDossierReport();
      setDossierData(d);
      setShowDossierModal(true);
    } catch (err) {
      console.error('Error loading intelligence dossier:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePulse = async () => {
    setLoading(true);
    try {
      const res = await triggerSimulatedIntercept();
      setLatestEvent(res.event);
      await refreshAll();
    } catch (err) {
      console.error('Error simulating live intercept:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHighlightNodes = (nodeIds: string[]) => {
    if (nodeIds.length > 0) {
      const found = graphData.nodes.find(n => nodeIds.includes(n.id));
      if (found) setSelectedNode(found);
      setActiveTab('graph');
    }
  };

  const handleHighlightPair = (sourceId: string, targetId: string) => {
    const found = graphData.nodes.find(n => n.id === sourceId || n.id === targetId);
    if (found) setSelectedNode(found);
    setActiveTab('graph');
  };

  // SSE Real-Time Analytics Stream
  useEffect(() => {
    if (!streaming) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE}/stream/live-intercepts`);
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.type === 'NEW_INTERCEPTED_CALL') {
            setLatestEvent(parsed);
            refreshAll();
          }
        } catch {
          // ignore telemetry heartbeat
        }
      };
      eventSource.onerror = () => {
        // EventSource automatically retries
      };
    } catch (err) {
      console.warn('SSE stream error:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [streaming, refreshAll]);

  const handleTraceVASP = (wallet: string) => {
    setVaspTargetWallet(wallet);
    setShowVASPModal(true);
  };

  // Sovereign Zero-Trust Ingress Barrier
  if (!currentSession) {
    return <AuthGate onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Bar with V3 & Sovereign Auth Controls */}
      <TopNav
        onLoadDemo={handleLoadDemo}
        onLoadFun={handleLoadFun}
        onLoadRakshak={handleLoadRakshak}
        onOpenBSA={handleOpenBSA}
        onOpenAudit={handleOpenAudit}
        onOpenDossier={handleOpenDossier}
        onOpenHiddenLinks={() => setShowHiddenLinksModal(true)}
        onOpenPathfinder={() => setShowPathfinderModal(true)}
        onOpenHierarchy={() => setShowHierarchyModal(true)}
        onOpenIngestHub={() => setShowIngestHubModal(true)}
        onOpenCompliance={() => setShowComplianceModal(true)}
        onOpenInterception={() => setShowInterceptionModal(true)}
        onOpenCrypto={() => setShowCryptoModal(true)}
        onOpenDisruption={() => setShowDisruptionModal(true)}
        onOpenVASPAttribution={() => setShowVASPModal(true)}
        agencyClearance={agencyClearance}
        onChangeAgencyClearance={handleAgencyClearanceChange}
        onToggleCopilot={() => setShowCopilot(!showCopilot)}
        isCopilotOpen={showCopilot}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onClear={handleClear}
        isVerified={auditVerified}
        totalBlocks={auditBlocks.length}
        loading={loading}
        currentSession={currentSession}
        onOpenAdmin={() => setShowAdminModal(true)}
        onLogout={handleLogout}
        onLockWorkstation={() => setIsManuallyLocked(true)}
      />

      {/* RTA Live Telecom Stream Banner */}
      <LiveStreamTicker
        latestEvent={latestEvent}
        streaming={streaming}
        onToggleStreaming={() => setStreaming(!streaming)}
        onSimulateEvent={handleSimulatePulse}
        loading={loading}
      />

      {/* Main Forensic Workstation Viewport */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Analytics & Ingestion Panel */}
        <AnalyticsPanel
          analytics={analytics}
          candidates={candidates}
          onSelectNode={(nodeId) => {
            const node = graphData.nodes.find(n => n.id === nodeId);
            if (node) setSelectedNode(node);
          }}
          onMerge={handleMerge}
          onUpload={handleUpload}
          loading={loading}
        />

        {/* Center Viewport: Switchable between GraphCanvas and GeoSpatialMapView */}
        {activeTab === 'graph' ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <GraphCanvas
              data={graphData}
              onSelectNode={setSelectedNode}
              selectedNodeId={selectedNode?.id}
            />
            <TimeSlider onTimeChange={handleTimeChange} />
          </div>
        ) : (
          <GeoSpatialMapView
            onSelectNode={(nodeId) => {
              const node = graphData.nodes.find(n => n.id === nodeId);
              if (node) setSelectedNode(node);
            }}
          />
        )}

        {/* Right Panel: Evidence Grounding Drawer */}
        <EvidenceDrawer
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onTraceVASP={handleTraceVASP}
        />
      </div>

      {/* Natural Language Investigator Copilot Drawer */}
      <InvestigatorCopilot
        isOpen={showCopilot}
        onClose={() => setShowCopilot(false)}
        onHighlightNodes={handleHighlightNodes}
      />

      {/* AI Heuristic Hidden Links Modal */}
      <HiddenLinksModal
        isOpen={showHiddenLinksModal}
        onClose={() => setShowHiddenLinksModal(false)}
        onHighlightPair={handleHighlightPair}
      />

      {/* Network Connection Pathfinder Modal */}
      <NetworkPathfinderModal
        isOpen={showPathfinderModal}
        onClose={() => setShowPathfinderModal(false)}
        nodes={graphData.nodes}
        onHighlightPath={handleHighlightNodes}
      />

      {/* Syndicate Command Hierarchy Matrix Modal */}
      <SyndicateHierarchyModal
        isOpen={showHierarchyModal}
        onClose={() => setShowHierarchyModal(false)}
        onSelectNode={(nodeId) => {
          const node = graphData.nodes.find(n => n.id === nodeId);
          if (node) setSelectedNode(node);
        }}
      />

      {/* MHA Problem Statement 26189 Compliance Matrix Modal */}
      <ComplianceMatrixModal
        isOpen={showComplianceModal}
        onClose={() => setShowComplianceModal(false)}
      />

      {/* Multi-Source Intelligence Ingestion Hub (7 Sources) */}
      <MultiSourceIngestModal
        isOpen={showIngestHubModal}
        onClose={() => setShowIngestHubModal(false)}
        onIngestSuccess={refreshAll}
      />

      {/* National Lawful Interception & 1M Scale Command Gateway */}
      <LawfulInterceptionModal
        isOpen={showInterceptionModal}
        onClose={() => setShowInterceptionModal(false)}
        onSelectSuspectNode={(nodeId) => {
          const node = graphData.nodes.find(n => n.id === nodeId);
          if (node) setSelectedNode(node);
        }}
      />

      {/* Web3 & Darknet Crypto-Hawala Forensics Modal */}
      <CryptoHawalaModal
        isOpen={showCryptoModal}
        onClose={() => setShowCryptoModal(false)}
        onSelectNode={(nodeId) => {
          const node = graphData.nodes.find(n => n.id === nodeId || n.label.includes(nodeId));
          if (node) setSelectedNode(node);
        }}
        onGraphUpdated={refreshAll}
      />

      {/* Target Neutralization & Syndicate Disruption Planner Modal */}
      <DisruptionPlannerModal
        isOpen={showDisruptionModal}
        onClose={() => setShowDisruptionModal(false)}
        nodes={graphData.nodes}
      />

      {/* Flagship SIH26182 VASP Attribution & MHA Sahyog Freezing Requisition Modal */}
      <VASPAttributionModal
        isOpen={showVASPModal}
        onClose={() => setShowVASPModal(false)}
        initialWallet={vaspTargetWallet}
      />

      {/* Forensic Modals */}
      {showBSAModal && (
        <BSACertificateModal
          certificate={bsaCertificate}
          onClose={() => setShowBSAModal(false)}
        />
      )}

      {showAuditModal && (
        <AuditLedgerModal
          blocks={auditBlocks}
          onClose={() => setShowAuditModal(false)}
          onRefresh={async () => {
            const blocks = await fetchAuditLedger();
            setAuditBlocks(blocks);
          }}
        />
      )}

      {showDossierModal && (
        <DossierReportModal
          dossier={dossierData}
          onClose={() => setShowDossierModal(false)}
        />
      )}

      {/* National Security Administration Console & Kill-Switch */}
      {currentSession && (
        <AdminDashboardModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          currentSession={currentSession}
        />
      )}

      {/* Zero-Trust Inactivity Terminal Lock Watchdog */}
      {currentSession && (
        <InactivityLockModal
          session={currentSession}
          isManuallyLocked={isManuallyLocked}
          onUnlock={() => setIsManuallyLocked(false)}
          onLogout={handleLogout}
          timeoutMinutes={15}
        />
      )}
    </div>
  );
};

export default App;
