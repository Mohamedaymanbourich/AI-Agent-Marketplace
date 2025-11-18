import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Footer from '../../components/user/Footer';
import Loading from '../../components/user/Loading';

const AgentDetails = () => {
  const { id } = useParams();
  const { backendUrl, currency, getToken } = useContext(AppContext);
  const [agentData, setAgentData] = useState(null);

  const fetchAgentData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/agent/${id}`);
      if (data.success) {
        setAgentData(data.agent);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRunAgent = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.post(`${backendUrl}/api/user/purchase`, {
        agentId: agentData._id,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        window.location.href = data.session_url;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchAgentData();
  }, []);

  return agentData ? (
    <>
      <div className="px-8 md:px-36 py-10 text-gray-800">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          <div className="flex-1">
            <h1 className="text-3xl font-semibold mb-2">{agentData.agentName}</h1>
            <p className="text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: agentData.agentDescription }} />
            <p className="text-sm text-gray-500 mb-2">Model: {agentData.modelType}</p>
            <p className="text-sm text-gray-500 mb-4">Prompt Template Preview:</p>
            <pre className="bg-gray-100 p-3 rounded text-sm text-gray-600 overflow-x-auto whitespace-pre-wrap">{agentData.promptTemplate}</pre>
            <button onClick={handleRunAgent} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition">
              Run Agent for {currency}  {agentData.pricePerRun}
            </button>
          </div>
          <div className="min-w-[300px] max-w-[400px]">
            <img src={agentData.agentThumbnail} alt="Agent" className="rounded-lg shadow-lg w-full object-cover" />
          </div>
        </div>
      </div>
      <Footer />
    </>
  ) : (
    <Loading />
  );
};

export default AgentDetails;
