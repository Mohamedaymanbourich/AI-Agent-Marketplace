import React from 'react'
import { assets } from '../../assets/assets'

const CallToAction = () => {
  return (
    <div className='flex flex-col items-center gap-4 pt-10 pb-24 px-8 md:px-0'>
      <h1 className='md:text-4xl text-xl text-gray-800 font-semibold'>
        Automate tasks with powerful AI agents
      </h1>
      <p className='text-gray-500 sm:text-sm text-center max-w-xl'>
        Deploy ready-to-use AI agents that help you research, write, analyze data, and more. No setup needed — just pick an agent and get results instantly.
      </p>
      <div className='flex items-center font-medium gap-6 mt-4'>
        <button className='px-10 py-3 rounded-md text-white bg-blue-600'>
          Get Started
        </button>
        <button className='flex items-center gap-2 text-blue-600 hover:underline '>
          Browse Agents
          <img src={assets.arrow_icon} alt="arrow_icon" />
        </button>
      </div>
    </div>
  )
}

export default CallToAction
