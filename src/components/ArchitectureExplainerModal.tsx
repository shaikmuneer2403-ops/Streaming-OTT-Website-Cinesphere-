import React from 'react';
import { X, Server, Database, Monitor, ArrowRight, Shield, Activity, Radio, Cpu, Layers } from 'lucide-react';

interface ArchitectureExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureExplainerModal: React.FC<ArchitectureExplainerModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div
        className="relative w-full max-w-4xl bg-[#0d111a] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl my-8 space-y-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Full-Stack Architecture & Request Lifecycle Guide</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            How CineSphere Works: End-to-End Data Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            A real-world breakdown of every layer in this OTT platform from client interaction to database execution and real-time streaming sockets.
          </p>
        </div>

        {/* The 8-Step Interactive Pipeline */}
        <div className="p-4 rounded-2xl bg-[#111622] border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
            The 8-Stage Request Flow:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#182032] rounded-xl border border-white/5 space-y-1">
              <span className="font-mono text-red-400 font-bold">1. USER ACTION</span>
              <p className="text-gray-300">
                User clicks <strong>"Watch Now"</strong>, likes a review, or changes playback progress on the video player.
              </p>
            </div>

            <div className="p-3 bg-[#182032] rounded-xl border border-white/5 space-y-1">
              <span className="font-mono text-amber-400 font-bold">2. FRONTEND CLIENT</span>
              <p className="text-gray-300">
                React state captures the event, updates UI optimistically, and dispatches an asynchronous call via <code className="text-amber-300">apiClient</code>.
              </p>
            </div>

            <div className="p-3 bg-[#182032] rounded-xl border border-white/5 space-y-1">
              <span className="font-mono text-blue-400 font-bold">3. FETCH WITH JWT</span>
              <p className="text-gray-300">
                Standard Fetch API attaches the <code className="text-blue-300">Authorization: Bearer &lt;token&gt;</code> header to authenticate the user session.
              </p>
            </div>

            <div className="p-3 bg-[#182032] rounded-xl border border-white/5 space-y-1">
              <span className="font-mono text-indigo-400 font-bold">4. EXPRESS ROUTE & MIDDLEWARE</span>
              <p className="text-gray-300">
                <code className="text-indigo-300">authMiddleware</code> verifies token validity, extracts <code className="text-indigo-300">req.user</code>, and confirms active account standing.
              </p>
            </div>

            <div className="p-3 bg-[#182032] rounded-xl border border-white/5 space-y-1">
              <span className="font-mono text-purple-400 font-bold">5. CONTROLLER LOGIC</span>
              <p className="text-gray-300">
                Validates input schemas, calculates completion percentages, and prepares query parameters for the persistence layer.
              </p>
            </div>

            <div className="p-3 bg-[#182032] rounded-xl border border-white/5 space-y-1">
              <span className="font-mono text-emerald-400 font-bold">6. REAL MONGODB PERSISTENCE</span>
              <p className="text-gray-300">
                Queries the MongoDB database <code className="text-emerald-300">cinesphere</code> collections (<code className="text-emerald-300">users</code>, <code className="text-emerald-300">login_activity</code>, <code className="text-emerald-300">movies</code>).
              </p>
            </div>

            <div className="p-3 bg-[#182032] rounded-xl border border-white/5 space-y-1">
              <span className="font-mono text-cyan-400 font-bold">7. REAL-TIME SOCKET.IO</span>
              <p className="text-gray-300">
                Simultaneously broadcasts events (<code className="text-cyan-300">new_comment</code>, <code className="text-cyan-300">live_monitoring_update</code>) to connected clients.
              </p>
            </div>

            <div className="p-3 bg-[#182032] rounded-xl border border-white/5 space-y-1">
              <span className="font-mono text-pink-400 font-bold">8. RESPONSE & REACT RENDER</span>
              <p className="text-gray-300">
                JSON response arrives at client. React updates state, re-renders the component, and displays updated watch progress.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Data Integrity Highlights */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Security Engineering & Best Practices</span>
          </h3>
          <ul className="text-xs text-gray-300 space-y-2 list-disc list-inside">
            <li><strong>bcrypt Hashing:</strong> Passwords are never stored in plain text; hashed using 10 rounds of salt.</li>
            <li><strong>Role-Based Access Control (RBAC):</strong> Admin operations are strictly isolated by <code className="text-red-400">requireAdmin</code> middleware.</li>
            <li><strong>Resilient In-Memory Fallback:</strong> Development runs instantly with seed data without requiring an external MongoDB server.</li>
            <li><strong>Socket.IO Live Telemetry:</strong> Admins can observe active stream viewers in real time without refreshing.</li>
          </ul>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition-all"
          >
            Close Architecture Guide
          </button>
        </div>
      </div>
    </div>
  );
};
