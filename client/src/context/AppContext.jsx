import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth, useUser } from "@clerk/clerk-react";
import humanizeDuration from "humanize-duration";

export const AppContext = createContext()

export const AppContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const currency = import.meta.env.VITE_CURRENCY

    const navigate = useNavigate()
    const { getToken } = useAuth()
    const { user } = useUser()

    const [showLogin, setShowLogin] = useState(false)
    const [isCreator, setIsCreator] = useState(false)
    const [allAgents, setAllAgents] = useState([])
    const [userData, setUserData] = useState(null)
    const [agentRuns, setAgentRuns] = useState([])

    // Fetch All Agents
    const fetchAllAgents = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/agent/all');
            if (data.success) {
                setAllAgents(data.agents)
                console.log(data.agents)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Fetch User Data
    const fetchUserData = async () => {
        try {
            if (user?.publicMetadata?.role === 'creator') {
                setIsCreator(true)
            }

            const token = await getToken();
            
            console.log("Fetching agent runs with token:", token);
            const { data } = await axios.get(backendUrl + '/api/user/data', { headers: { Authorization: `Bearer ${token}` } })

            if (data.success) {
                setUserData(data.user)
            } else {
                // If the backend reports user not found, attempt to create the user via /api/clerk
                console.log("API Error:", data.message)
                toast.error(data.message)
                if (typeof data.message === 'string' && data.message.toLowerCase().includes('user not found')) {
                    await createClerkUser(token)
                }
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    // Create Clerk user on backend and retry fetching user data
    const createClerkUser = async (token, eventType = 'user.created') => {
        try {
            console.log('Attempting to create Clerk user via /api/clerk')
            // build payload similar to Clerk webhook structure so backend can reuse webhook logic
            // normalize email: Clerk's SDK may expose email objects; ensure we pass a string
            let emailStr = '';
            const primary = user?.primaryEmailAddress || null;
            if (typeof primary === 'string') {
                emailStr = primary;
            } else if (primary && typeof primary === 'object') {
                emailStr = primary.email_address || primary.emailAddress || '';
            } else if (typeof user?.email === 'string') {
                emailStr = user.email;
            } else if (user?.emailAddresses && user.emailAddresses[0]) {
                const ea = user.emailAddresses[0];
                emailStr = ea.email_address || ea.emailAddress || '';
            }

            const payload = {
                type: eventType,
                data: {
                    id: user?.id || null,
                    email_addresses: [
                        { email_address: emailStr }
                    ],
                    first_name: user?.firstName || user?.first_name || '',
                    last_name: user?.lastName || user?.last_name || '',
                    image_url: user?.image || user?.profileImageUrl || user?.imageUrl || ''
                }
            }
            console.log('createClerk payload', payload)

            // generate svix-like headers (note: valid svix signature requires the webhook secret,
            // which should not be shipped to the client; these headers act as placeholders
            // so the backend can reuse webhook parsing logic if it accepts token-authenticated calls)
            const svixId = `${Date.now()}-${Math.random().toString(36).slice(2,10)}`
            const svixTimestamp = Math.floor(Date.now() / 1000).toString()
            const svixSignature = '' // cannot compute real signature client-side

            const createRes = await axios.post(backendUrl + '/clerk', payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            if (createRes.data && createRes.data.success) {
                toast.success('User created');
                // Retry fetching user data a few times as backend may be eventually consistent
                const attempts = 3
                for (let i = 0; i < attempts; i++) {
                    try {
                        // small delay between retries
                        await new Promise((res) => setTimeout(res, 800))
                        const { data: newData } = await axios.get(backendUrl + '/api/user/data', { headers: { Authorization: `Bearer ${token}` } })
                        if (newData.success) {
                            setUserData(newData.user)
                            return
                        }
                    } catch (err) {
                        console.warn('Retry fetch user data failed:', err.message || err)
                    }
                }
                console.warn('User create succeeded but fetching user data did not return a user after retries')
            } else {
                console.warn('Create user response:', createRes.data)
            }
        } catch (err) {
            console.error('Error creating clerk user:', err);
            toast.error('Failed to create user: ' + (err.message || ''))
        }
    }

    // Fetch Executed Agents for User
    const fetchUserAgentRuns = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(backendUrl + '/api/user/executions',
                { headers: { Authorization: `Bearer ${token}` } });

            if (data.success) {
                setAgentRuns(data.executions.reverse())
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const calculateRating = (agent) => {
        if (!agent.agentRatings?.length) return 0
        const total = agent.agentRatings.reduce((acc, val) => acc + val.rating, 0)
        return Math.floor(total / agent.agentRatings.length)
    }

    useEffect(() => {
        fetchAllAgents()
    }, [])

    useEffect(() => {
        if (user) {
            fetchUserData()
            // fetchUserAgentRuns()
        }
    }, [user])

    const value = {
        showLogin, setShowLogin,
        backendUrl, currency, navigate,
        userData, setUserData, getToken,
        allAgents, fetchAllAgents,
        // agentRuns, fetchUserAgentRuns,
        calculateRating,
        isCreator, setIsCreator
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}
