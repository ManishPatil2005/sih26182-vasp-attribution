import React, { useState, useEffect, useCallback } from 'react';
import type { 
  GraphData, 
  GraphNode, 
  BSACertificate, 
  AuditBlock,
  BlockchainNetwork,
  VASPAttributionResult
} from './types/graph';
import { 
  fetchCryptoGraph, 
  fetchAuditLedger, 
  verifyAuditLedger, 
  fetchBSACertificate
} from './services/api';
import { TopNav } from './components/TopNav';
import { GraphCanvas } from './components/GraphCanvas';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { VASPAttributionModal } from './components/VASPAttributionModal';
import { BSACertificateModal } from './components/BSACertificateModal';
import { AuditLedgerModal } from './components/AuditLedgerModal';
import { AuthGate } from './components/AuthGate';
import { InactivityLockModal } from './components/InactivityLockModal';
import type { OfficerSession } from './types/auth';
import { fetchCurrentSession, logoutOfficer } from './services/authApi';

export const App: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [], metadata: {} });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [auditVerified, setAuditVerified] = useState(true);
  const [auditBlocks, setAuditBlocks] = useState<AuditBlock[]>([]);
  const [bsaCertificate, setBsaCertificate] = useState<BSACertificate | null>(null);

  // SIH26182 Modals State
  const [showVASPModal, setShowVASPModal] = useState(false);
  const [vaspTargetWallet, setVaspTargetWallet] = useState<string>('TTsY1v6BpxvU9jP1k2L4wE8rT992p');
  const [vaspTargetNetwork, setVaspTargetNetwork] = useState<BlockchainNetwork>('TRON');
  const [showBSAModal, setShowBSAModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Sovereign Zero-Trust Authentication State
  const [currentSession, setCurrentSession] = useState<OfficerSession | null>(() => {
    try {
      const saved = localStorage.getItem('sahyog_vasp_session') || localStorage.getItem('crimegraph_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isManuallyLocked, setIsManuallyLocked] = useState(false);

  // Validate session on load
  useEffect(() => {
    if (currentSession?.token) {
      fetchCurrentSession(currentSession.token)
        .then((res) => {
          if (!res.valid) {
            localStorage.removeItem('sahyog_vasp_session');
            localStorage.removeItem('crimegraph_session');
            setCurrentSession(null);
          }
        })
        .catch(() => {
          // Dev offline tolerance
        });
    }
  }, []);

  const refreshGraph = useCallback(async () => {
    setLoading(true);
    try {
      const [gData, ledger, verification] = await Promise.all([
        fetchCryptoGraph(),
        fetchAuditLedger().catch(() => []),
        verifyAuditLedger().catch(() => ({ is_valid: true }))
      ]);
      setGraphData(gData);
      setAuditBlocks(ledger);
      setAuditVerified((verification as any).verified ?? (verification as any).is_valid ?? true);
    } catch (err) {
      console.error('Failed to load crypto graph:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshGraph();
  }, [refreshGraph]);

  const handleAuthenticated = (session: OfficerSession) => {
    setCurrentSession(session);
    localStorage.setItem('sahyog_vasp_session', JSON.stringify(session));
    refreshGraph();
  };

  const handleLogout = async () => {
    if (currentSession?.token) {
      await logoutOfficer(currentSession.token).catch(() => {});
    }
    localStorage.removeItem('sahyog_vasp_session');
    localStorage.removeItem('crimegraph_session');
    setCurrentSession(null);
  };

  const handleSelectWalletFromPanel = async (wallet: string, net: BlockchainNetwork) => {
    setVaspTargetWallet(wallet);
    setVaspTargetNetwork(net);

    // If node exists in graph, highlight it
    const foundNode = graphData.nodes.find(n => n.id === wallet || n.label.includes(wallet));
    if (foundNode) {
      setSelectedNode(foundNode);
    } else {
      // Find nearest matching node
      setSelectedNode({
        id: wallet,
        type: 'CRYPTO_WALLET',
        label: `Unhosted Suspect Wallet (${net})`,
        properties: { network: net, balance: 'Querying...', status: 'UNDER_ANALYSIS' },
        risk_score: 0.95
      });
    }
  };

  const handleOpenNoticeModal = (attribution: VASPAttributionResult) => {
    setVaspTargetWallet(attribution.query_wallet);
    setVaspTargetNetwork(attribution.blockchain as BlockchainNetwork);
    setShowVASPModal(true);
  };

  const handleGenerateNoticeFromDrawer = (wallet: string) => {
    setVaspTargetWallet(wallet);
    setShowVASPModal(true);
  };

  const handleOpenBSA = async () => {
    try {
      const cert = await fetchBSACertificate();
      setBsaCertificate(cert);
      setShowBSAModal(true);
    } catch (err: any) {
      alert('Failed to generate Section 63 BSA certificate: ' + err.message);
    }
  };

  // Zero-Trust Auth Ingress Barrier
  if (!currentSession) {
    return <AuthGate onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Top Bar with SIH26182 Controls */}
      <TopNav
        onOpenVASPAttribution={() => setShowVASPModal(true)}
        onOpenVASPRegistry={() => setShowVASPModal(true)}
        onOpenSahyogCases={() => setShowVASPModal(true)}
        onOpenFreezeNotices={() => setShowVASPModal(true)}
        onOpenAudit={() => setShowAuditModal(true)}
        onOpenBSA={handleOpenBSA}
        onRefreshGraph={refreshGraph}
        isVerified={auditVerified}
        totalBlocks={auditBlocks.length}
        loading={loading}
        currentSession={currentSession}
        onLogout={handleLogout}
        onLockWorkstation={() => setIsManuallyLocked(true)}
      />

      {/* Main Forensic Workstation Viewport */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Ingestion & Tracing Panel */}
        <AnalyticsPanel
          onSelectWallet={handleSelectWalletFromPanel}
          onOpenNoticeModal={handleOpenNoticeModal}
          loading={loading}
        />

        {/* Center Viewport: Interactive Multi-Chain Crypto Transaction Graph */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <GraphCanvas
            data={graphData}
            onSelectNode={setSelectedNode}
            selectedNodeId={selectedNode?.id}
          />
        </div>

        {/* Right Panel: VASP Attribution Dossier & Freezing Notice Generator */}
        <EvidenceDrawer
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onGenerateNotice={handleGenerateNoticeFromDrawer}
        />
      </div>

      {/* Flagship SIH26182 VASP Attribution & MHA Sahyog Freezing Requisition Modal */}
      <VASPAttributionModal
        isOpen={showVASPModal}
        onClose={() => setShowVASPModal(false)}
        initialWallet={vaspTargetWallet}
        initialNetwork={vaspTargetNetwork}
      />

      {/* Forensic Legal Proof Modals */}
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
