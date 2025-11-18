import React, { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import logo2 from '../../assets/logo2.png';

import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";

const Header = () => {
  const { backendUrl, isCreator, setIsCreator, navigate, getToken } =
    useContext(AppContext);

  const { openSignIn, openSignUp } = useClerk();
  const { user } = useUser();

  const location = useLocation();
  const isAgentPage = location.pathname.includes("/agents");

  const [open, setOpen] = useState(false);

  const becomeCreator = async () => {
    try {
      if (isCreator) return navigate("/creator");

      const token = await getToken();
      const { data } = await axios.get(
        `${backendUrl}/api/creator/update-role`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      data.success ? (toast.success(data.message), setIsCreator(true))
                   : toast.error(data.message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <header
      className={`border-b border-gray-500/30 py-4 ${

        isAgentPage ? "bg-white" : "bg-white"
      }`}
    >
      {/* ---- top bar ---- */}
      <div className="flex items-center justify-between px-2 sm:px-8 md:px-8 lg:px-8">
        {/* logo */}

<img
  src={logo2}
  alt="Promptly logo"
  className="w-28 lg:w-32 cursor-pointer"
  onClick={() => navigate("/")}
/>



        {/* --- NAV + SEARCH + AUTH (desktop ≥ md) --- */}
        <div className="hidden md:flex items-center gap-4">
          {/* nav links */}
          <div className="flex items-center gap-4 text-gray-600">
            {user && (

                <button onClick={becomeCreator}>
              {isCreator ? "Creator Dashboard" : "Become an Agent Creator"}
            </button>
            )}
            {user && (
              <>
                <span>|</span>
                <Link to="/my-agents" className="hover:text-gray-900">
                  My&nbsp;Agents
                </Link>
              </>
            )}
          </div>

          {/* search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search agents…"
              className="pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* auth */}
          {user ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <>
              <button
                onClick={openSignIn}
                className="px-4 py-2 rounded-md border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={openSignUp}
                className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                Sign Up
              </button>
            </>
          )}
        </div>

        {/* burger (mobile) */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* ---- mobile panel ---- */}
      {open && (
        <div className="md:hidden flex flex-col gap-6 px-4 pb-6 pt-4">
          {/* search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search agents…"
              className="pl-10 pr-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* nav links */}
          <div className="flex flex-col gap-4 text-gray-700">
            <button onClick={becomeCreator}>
              {isCreator ? "Creator Dashboard" : "Become an Agent Creator"}
            </button>
            {user && <Link to="/my-agents">My&nbsp;Agents</Link>}
          </div>

          {/* auth */}
          <div className="flex flex-col gap-2">
            {user ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <>
                <button
                  onClick={openSignIn}
                  className="w-full px-4 py-2 rounded-md border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={openSignUp}
                  className="w-full px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
