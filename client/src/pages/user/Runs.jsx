/*  src/pages/dashboard/Runs.jsx
    — Run a purchased agent once
------------------------------------------------------------------- */
import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";           // Clerk auth

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const Runs = () => {
  /* ------------ route & query params --------------------------- */
  const { id: routeId } = useParams();      // /dashboard/runs/:id
  const location        = useLocation();    // ?agent=…

  /* ------------ Clerk helper to fetch JWT ---------------------- */
  const { getToken } = useAuth();

  /* ------------ component state -------------------------------- */
  const [purchaseId, setPurchaseId] = useState(null);
  const [agentName,  setAgentName]  = useState("");
  const [input,      setInput]      = useState("");
  const [output,     setOutput]     = useState("");
  const [isRunning,  setIsRunning]  = useState(false);

  /* Resolve purchaseId & agentName once on mount / URL change ---- */
  useEffect(() => {
    const params  = new URLSearchParams(location.search);
    const queryId = params.get("purchaseId");
    const name    = params.get("agent");

    const finalId = routeId || queryId;
    setPurchaseId(finalId);
    if (name) setAgentName(decodeURIComponent(name));
  }, [routeId, location.search]);

  /* ------------ event handlers --------------------------------- */
  const handleInputChange = (e) => setInput(e.target.value);

  const processInput = async () => {
    if (!input.trim() || !purchaseId) return;

    setIsRunning(true);
    setOutput("Running agent…");

    try {
      const token = await getToken();                       // Clerk JWT
      const res   = await axios.post(
        `${API_URL}/api/user/run-agent`,                    // backend
        { purchaseId, input },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Agent run response:", res.data);
      setOutput(
        res.data.success
          ? res.data.body || "Agent run completed successfully."
          : res.data.message || "Agent run failed."
      );
    } catch (err) {
      console.error(err);
      setOutput(
        err.response?.data?.message ||
        "An unexpected error occurred while running the agent."
      );
    } finally {
      setIsRunning(false);
    }
  };

  /* ------------------------------ UI --------------------------- */
  return (
    <div className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold mb-2">Run Your Agent</h1>

        {agentName && (
          <p className="text-gray-600 mb-6">
            <span className="font-medium">Agent:</span> {agentName}
          </p>
        )}

        {purchaseId ? (
          <>
            {/* INPUT */}
            <div className="mb-5">
              <label htmlFor="input" className="block text-sm font-medium mb-1">
                Input
              </label>
              <textarea
                id="input"
                value={input}
                onChange={handleInputChange}
                className="w-full rounded border-gray-300 focus:ring-blue-500 p-3 min-h-[120px]"
                placeholder="Tell the agent what to do…"
              />
            </div>

            {/* RUN BUTTON */}
            <div className="mb-5">
              <button
                onClick={processInput}
                disabled={isRunning || !input.trim()}
                className={`px-5 py-2 rounded text-white text-sm font-medium transition ${
                  isRunning || !input.trim()
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isRunning ? "Running…" : "Run Agent"}
              </button>
            </div>

            {/* OUTPUT */}
            <div>
              <label htmlFor="output" className="block text-sm font-medium mb-1">
                Output
              </label>
              <textarea
                id="output"
                value={output}
                readOnly
                className="w-full rounded border-gray-300 bg-gray-50 p-3 min-h-[120px]"
                placeholder="Result will appear here…"
              />
            </div>
          </>
        ) : (
          <div className="text-red-500 font-semibold">
            No valid purchase ID found in URL.
          </div>
        )}
      </div>
    </div>
  );
};

export default Runs;
