import { useState, useEffect } from 'react'

function App() {
  // Navigation and authentication states
  const [currentPage, setCurrentPage] = useState('dashboard') // 'dashboard', 'about', 'feedback'
  const [role, setRole] = useState('customer') // 'customer', 'agent', 'manager'
  const [agentDepartment, setAgentDepartment] = useState('All') // Tracks which queue the agent is working

  // data states for tickets and forms
  const [currentTicket, setCurrentTicket] = useState(null)
  const [reviewTickets, setReviewTickets] = useState([])
  const [formData, setFormData] = useState({ customer_email: '', description: '', category: 'General Inquiry' })
  
  // feedback form state
  const [feedbackData, setFeedbackData] = useState({ customer_email: '', rating: '5', comments: '' })
  const [feedbacksList, setFeedbacksList] = useState([])
  const [isRefreshingQueue, setIsRefreshingQueue] = useState(false)
  const [isRefreshingFeedback, setIsRefreshingFeedback] = useState(false)

  // toast notification state
  const [toast, setToast] = useState(null)

  // shows message on screen for 3 seconds
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null) 
    }, 3000)
  }

 //backend logic starts here
  const handleSubmit = async (e) => {
    e.preventDefault() 
    try {
      await fetch('http://127.0.0.1:8000/tickets/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      showToast("Ticket Successfully Submitted!", "success")
      setFormData({ ...formData, description: '', customer_email: '' })
    } catch (error) {
      console.error("Error submitting ticket:", error)
      showToast("Failed to submit ticket.", "error")
    }
  }

  const fetchNextTicket = async () => {
    try {
      // Send the selected department to the Python backend
      const response = await fetch(`http://127.0.0.1:8000/tickets/next/?category=${encodeURIComponent(agentDepartment)}`)
      const data = await response.json()
      
      if (data.message && data.message.includes("Queue is empty")) {
        showToast(`Inbox Zero! No open tickets for ${agentDepartment}.`, "info")
        setCurrentTicket(null)
      } else {
        setCurrentTicket(data)
        showToast("New critical ticket assigned.", "success")
      }
    } catch (error) {
      console.error("Error fetching ticket:", error)
      showToast("Failed to pull next ticket.", "error")
    }
  }

  const handleResolve = async () => {
    try {
      await fetch(`http://127.0.0.1:8000/tickets/${currentTicket.id}`, { method: 'DELETE' })
      setCurrentTicket(null) 
    } catch (error) {
      console.error("Error resolving ticket:", error)
    }
  }

  const fetchReviewTickets = async (showSuccessToast = true) => {
    setIsRefreshingQueue(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/tickets/review/')
      if (!response.ok) {
        throw new Error(`Review queue request failed with status ${response.status}`)
      }
      const data = await response.json()
      setReviewTickets(data)
      if (showSuccessToast) {
        showToast(`Review queue refreshed: ${data.length} ticket${data.length === 1 ? '' : 's'}.`, "info")
      }
    } catch (error) {
      console.error("Error fetching review tickets:", error)
      showToast("Could not refresh review queue. Check that the backend is running.", "error")
    } finally {
      setIsRefreshingQueue(false)
    }
  }

  const fetchAllFeedbacks = async (showSuccessToast = true) => {
    setIsRefreshingFeedback(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/feedback/')
      if (!response.ok) {
        throw new Error(`Feedback request failed with status ${response.status}`)
      }
      const data = await response.json()
      setFeedbacksList(data)
      if (showSuccessToast) {
        showToast(`Feedback refreshed: ${data.length} item${data.length === 1 ? '' : 's'}.`, "info")
      }
    } catch (error) {
      console.error("Error fetching feedback:", error)
      showToast("Could not refresh feedback. Restart the backend if this endpoint is missing.", "error")
    } finally {
      setIsRefreshingFeedback(false)
    }
  }

  useEffect(() => {
    if (role === 'manager' && currentPage === 'dashboard') {
      const loadManagerDashboard = async () => {
        try {
          const [ticketsResponse, feedbackResponse] = await Promise.all([
            fetch('http://127.0.0.1:8000/tickets/review/'),
            fetch('http://127.0.0.1:8000/feedback/')
          ])

          const [tickets, feedbacks] = await Promise.all([
            ticketsResponse.json(),
            feedbackResponse.json()
          ])

          setReviewTickets(tickets)
          setFeedbacksList(feedbacks)
        } catch (error) {
          console.error("Error loading manager dashboard:", error)
        }
      }

      loadManagerDashboard()
    }
  }, [role, currentPage])

  const handleApprove = async (id) => {
    try {
      await fetch(`http://127.0.0.1:8000/tickets/${id}/approve`, { method: 'PUT' })
      fetchReviewTickets()
    } catch (error) {
      console.error("Error approving ticket:", error)
    }
  }

  const handleSpam = async (id) => {
    try {
      await fetch(`http://127.0.0.1:8000/tickets/${id}`, { method: 'DELETE' })
      fetchReviewTickets()
    } catch (error) {
      console.error("Error deleting spam:", error)
    }
  }

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    
    try {
      //Send the data to your Python backend
      await fetch('http://127.0.0.1:8000/feedback/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      })
      
      //Show success message
      showToast(`Thank you! Your ${feedbackData.rating}-star feedback has been saved.`, "success")
      
      //Clear the form
      setFeedbackData({ customer_email: '', rating: '5', comments: '' }) 
      
    } catch (error) {
      console.error("Error submitting feedback:", error)
      showToast("Failed to send feedback.", "error")
    }
  }

  //UI rendering starts here
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* floating toast notifications */}
      {toast && (
        <div className={`fixed top-24 right-8 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold flex items-center gap-3 transition-all duration-300 transform translate-y-0 opacity-100 ${
          toast.type === 'success' ? 'bg-green-600 text-white border border-green-500' : 
          toast.type === 'error' ? 'bg-red-600 text-white border border-red-500' : 
          'bg-slate-800 text-white border border-slate-700'
        }`}>
          <span>
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
          </span>
          {toast.message}
        </div>
      )}
      
      {/* professional navbar */}
      <nav className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center px-8 z-20 sticky top-0">
        <div className="flex items-center gap-10">
          <h1 className="text-xl font-bold tracking-wide">TriageAI</h1>
          <div className="flex gap-6 text-sm font-medium">
            <button onClick={() => setCurrentPage('dashboard')} className={`${currentPage === 'dashboard' ? 'text-white' : 'text-slate-400 hover:text-slate-200'} transition`}>Dashboard</button>
            <button onClick={() => setCurrentPage('about')} className={`${currentPage === 'about' ? 'text-white' : 'text-slate-400 hover:text-slate-200'} transition`}>About Platform</button>
            <button onClick={() => setCurrentPage('feedback')} className={`${currentPage === 'feedback' ? 'text-white' : 'text-slate-400 hover:text-slate-200'} transition`}>Feedback</button>
          </div>
        </div>
        
        {/* Only show Role Selector on Dashboard */}
        {currentPage === 'dashboard' && (
          <div className="flex items-center gap-3 bg-slate-800 px-3 py-1.5 rounded border border-slate-700">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Role:</span>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="bg-transparent text-white text-sm outline-none cursor-pointer">
              <option value="customer">Customer (Public)</option>
              <option value="agent">Support Agent</option>
              <option value="manager">Human Review Manager</option>
            </select>
          </div>
        )}
      </nav>

      {/* conditional marketing(Only on 'About' page now) */}
      {currentPage === 'about' && (
        <div className="relative overflow-hidden bg-slate-900 text-white py-20 mb-10 border-b border-slate-800">
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <div className="absolute top-[-50%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
            <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
            <h2 className="text-5xl font-bold mb-4 tracking-tight">TriageAI</h2>
            <p className="text-xl text-slate-300 font-light tracking-wide">
              A real-time customer support intelligence platform.
            </p>
          </div>
        </div>
      )}

      {/* main content area */}
      <div className="flex-grow">
        
        {/* dashboard */}
        {currentPage === 'dashboard' && (
          <div className="animate-fade-in-up">
            
          {/* CUSTOMER VIEW */}
            {role === 'customer' && currentPage === 'dashboard' && (
              <div className="relative flex flex-col items-center w-full min-h-screen bg-slate-900">
                
                {/* full page fixed video background */}
                {/* fixed class glues the video to the screen so it never scrolls away. */}
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-40 pointer-events-none"
                >
                  <source src="/network-bg.mp4" type="video/mp4" />
                </video>

                {/*THE SCROLLING CONTENT */}
                <div className="relative z-10 w-full flex flex-col items-center px-4">
                  
                  {/*Welcome Text */}
                  <div className="flex flex-col items-center justify-center min-h-[70vh] text-center w-full max-w-3xl pt-20">
                    <h1 className="text-5xl font-light text-white mb-6 tracking-tight drop-shadow-lg">
                      Welcome to <span className="font-semibold text-blue-400">TriageAI</span>
                    </h1>
                    <p className="text-lg text-slate-300 leading-relaxed mb-16 drop-shadow">
                      Our intelligent routing engine analyzes your request in real-time to ensure it reaches the correct teams immediately. Let us know how we can assist you today.
                    </p>
                    <div className="text-slate-400 flex flex-col items-center animate-bounce">
                      <span className="text-sm font-semibold uppercase tracking-widest mb-2 drop-shadow">Scroll to Submit</span>
                      <svg className="w-6 h-6 drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    </div>
                  </div>

                  {/* Premium White Form Box */}
                  <div className="max-w-xl w-full bg-white p-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 mt-10 mb-32 relative overflow-hidden backdrop-blur-md">
                    
                    {/* Premium Brand Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                    
                    <div className="mb-8">
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Create a Support Ticket</h2>
                      <p className="text-sm text-slate-500 mt-1">Our AI will route your request immediately.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                        <input 
                          type="email" 
                          required 
                          value={formData.customer_email} 
                          onChange={(e) => setFormData({...formData, customer_email: e.target.value})} 
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3.5 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 placeholder-slate-400 font-medium" 
                          placeholder="example: name@gmail.com" 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Issue Category</label>
                        <select 
                          value={formData.category} 
                          onChange={(e) => setFormData({...formData, category: e.target.value})} 
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3.5 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 cursor-pointer font-medium"
                        >
                          <option>General Inquiry</option>
                          <option>Technical Support</option>
                          <option>Billing & Sponsorship</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                        <textarea 
                          rows="5" 
                          required 
                          value={formData.description} 
                          onChange={(e) => setFormData({...formData, description: e.target.value})} 
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3.5 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 resize-none placeholder-slate-400 font-medium" 
                          placeholder="Please provide details about your request..." 
                        />
                      </div>
                      
                      <button type="submit" className="mt-4 w-full bg-slate-900 text-white font-bold py-4 rounded-lg hover:bg-blue-600 transition-colors duration-300 shadow-md">
                        Submit Ticket
                      </button>
                    </form>
                  </div>

                </div>
              </div>
            )}
            
            {/* agent view with department selection */}
            {role === 'agent' && currentPage === 'dashboard' && (
              <div className="relative min-h-screen w-full flex flex-col items-center pt-20 pb-32 px-4 bg-slate-900">
                
                {/* 1. AGENT VIDEO BACKGROUND */}
                <video autoPlay loop muted playsInline className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-40 pointer-events-none">
                  <source src="/agent-bg.mp4" type="video/mp4" />
                </video>
                {/* Dark Overlay for Readability */}
                <div className="fixed inset-0 bg-slate-900/70 z-0"></div>

                <div className="relative z-10 w-full max-w-3xl flex flex-col items-center">
                  
                  {/* Glowing Header */}
                  <div className="text-center mb-10 w-full">
                    <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">Agent Workspace</h2>
                    <p className="text-slate-400 font-medium mt-2">Active Shift: <span className="text-blue-400">{agentDepartment}</span></p>
                  </div>

                  {!currentTicket ? (
                    /* EMPTY STATE / SHIFT SELECTOR (Glassmorphism) */
                    <div className="bg-white/95 backdrop-blur-xl p-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 flex flex-col items-center w-full relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                      
                      <div className="w-full max-w-md mb-8">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Assigned Department</label>
                        <select 
                          value={agentDepartment} 
                          onChange={(e) => setAgentDepartment(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3.5 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 cursor-pointer font-medium shadow-sm"
                        >
                          <option value="All">Cross-Functional (All Departments)</option>
                          <option value="General Inquiry">General Inquiry</option>
                          <option value="Technical Support">Technical Support</option>
                          <option value="Billing & Sponsorship">Billing & Sponsorship</option>
                        </select>
                      </div>

                      <button onClick={fetchNextTicket} className="w-full max-w-md bg-slate-900 text-white text-lg font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-blue-600 transition-all duration-300 transform hover:-translate-y-1">
                        Pull Next Urgent Ticket
                      </button>
                    </div>
                  ) : (
                    /* ACTIVE TICKET CARD (Glassmorphism) */
                    <div className="w-full bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 relative overflow-hidden">
                      <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-blue-500 to-cyan-400"></div>
                      
                      <div className="flex justify-between items-start mb-8 pl-4">
                        <div>
                          <span className="font-bold text-blue-700 bg-blue-100/80 px-4 py-1.5 rounded-full text-sm shadow-sm">{currentTicket.category}</span>
                          <h3 className="text-slate-500 text-sm mt-4">Customer: <span className="font-bold text-slate-900">{currentTicket.customer_email}</span></h3>
                        </div>
                        <div className="text-right bg-red-50/90 p-4 rounded-xl border border-red-100 shadow-sm">
                          <span className="text-xs text-red-600 font-bold uppercase tracking-wider block mb-1">AI Priority</span>
                          <span className="text-4xl font-black text-red-600">{currentTicket.ai_priority} <span className="text-sm font-bold text-red-400">/ 100</span></span>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50/80 p-6 rounded-xl border border-slate-200 mb-8 ml-4 shadow-inner">
                        <p className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap font-medium">{currentTicket.description}</p>
                      </div>
                      
                      <button onClick={handleResolve} className="w-full ml-2 bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-green-600 transition-colors duration-300 shadow-md">
                        ✓ Mark as Resolved & Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* manager view */}
            {role === 'manager' && currentPage === 'dashboard' && (
              <div className="relative min-h-screen w-full pt-16 pb-32 px-4 bg-slate-900">
                
                {/* 1. HUMAN REVIEW VIDEO BACKGROUND */}
                <video autoPlay loop muted playsInline className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-30 pointer-events-none">
                  <source src="/manager-bg.mp4" type="video/mp4" />
                </video>
                {/* Dark Overlay for Readability */}
                <div className="fixed inset-0 bg-slate-900/80 z-0"></div>

                <div className="relative z-10 max-w-6xl mx-auto">
                  
                  {/* --- HUMAN REVIEW SANDBOX --- */}
                  <div className="flex justify-between items-end mb-8 border-b border-white/20 pb-4">
                    <div>
                      <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Human Review Sandbox</h2>
                      <p className="text-sm text-slate-400 mt-2 font-medium">Tickets flagged by AI due to low confidence scores requiring human validation.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchReviewTickets()}
                      disabled={isRefreshingQueue}
                      className="bg-white/10 hover:bg-white/20 disabled:opacity-60 disabled:cursor-not-allowed text-white border border-white/30 font-bold py-2 px-6 rounded-lg backdrop-blur-md transition-all shadow-lg"
                    >
                      {isRefreshingQueue ? 'Refreshing...' : '↻ Refresh Queue'}
                    </button>
                  </div>

                  {reviewTickets.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-md py-20 px-4 text-center rounded-2xl border border-white/20 shadow-2xl">
                      <h3 className="text-xl font-bold text-white tracking-wide">Sandbox is Empty</h3>
                      <p className="text-slate-400 mt-2 text-sm font-medium">No manual human reviews are currently required.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-5">
                      {/* ... rest of the code remains exactly the same ... */}
                      {reviewTickets.map(ticket => (
                        <div key={ticket.id} className="bg-white/95 backdrop-blur-xl p-6 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/20 flex flex-col md:flex-row gap-6 items-center transition-transform hover:scale-[1.01]">
                          <div className="flex flex-col gap-3 min-w-[120px] text-center">
                            <div className="bg-slate-100 text-slate-800 py-2.5 rounded-lg border border-slate-200 shadow-sm">
                              <span className="block text-[10px] uppercase font-black text-slate-500 tracking-wider">Priority</span>
                              <span className="text-xl font-black">{ticket.ai_priority}</span>
                            </div>
                            <div className="bg-purple-100 text-purple-800 py-2.5 rounded-lg border border-purple-200 shadow-sm">
                              <span className="block text-[10px] uppercase font-black text-purple-500 tracking-wider">Confidence</span>
                              <span className="text-xl font-black">{ticket.confidence}%</span>
                            </div>
                          </div>
                          <div className="flex-grow w-full">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-xs font-bold text-white bg-slate-800 px-3 py-1 rounded-md shadow-sm">{ticket.category}</span>
                              <span className="text-xs font-bold text-slate-400">ID: #{ticket.id}</span>
                            </div>
                            <p className="text-slate-800 text-base font-semibold border-l-4 border-slate-300 pl-4 py-1 mb-3 bg-slate-50/50 rounded-r-lg">"{ticket.description}"</p>
                            <span className="text-sm font-medium text-slate-500">From: <span className="text-slate-900 font-bold">{ticket.customer_email}</span></span>
                          </div>
                          <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto">
                            <button onClick={() => handleApprove(ticket.id)} className="flex-1 md:flex-none bg-slate-900 text-white border border-slate-700 font-bold py-3 px-6 rounded-xl hover:bg-green-600 transition-colors shadow-md text-sm">
                              Approve & Route
                            </button>
                            <button onClick={() => handleSpam(ticket.id)} className="flex-1 md:flex-none bg-white text-red-600 border-2 border-red-100 font-bold py-3 px-6 rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors shadow-md text-sm">
                              Mark as Spam
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* --- COMPANY FEEDBACK INBOX --- */}
                  <div className="mt-20 border-t border-white/20 pt-12 mb-20">
                    <div className="flex justify-between items-end mb-8 border-b border-white/20 pb-4">
                      <div>
                        <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Platform Feedback</h2>
                        <p className="text-sm text-slate-400 mt-2 font-medium">Direct feedback and ratings submitted by users.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => fetchAllFeedbacks()}
                        disabled={isRefreshingFeedback}
                        className="bg-white/10 hover:bg-white/20 disabled:opacity-60 disabled:cursor-not-allowed text-white border border-white/30 font-bold py-2 px-6 rounded-lg backdrop-blur-md transition-all shadow-lg"
                      >
                        {isRefreshingFeedback ? 'Refreshing...' : '↻ Refresh Feedback'}
                      </button>
                    </div>

                    {feedbacksList.length === 0 ? (
                      <div className="bg-white/10 backdrop-blur-md py-16 px-4 text-center rounded-2xl border border-white/20 shadow-2xl">
                        <h3 className="text-lg font-bold text-white">No Feedback Yet</h3>
                        <p className="text-slate-400 mt-1 text-sm font-medium">When users submit platform feedback, it will appear here.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {feedbacksList.map(item => (
                          <div key={item.id} className="bg-white/95 backdrop-blur-xl p-6 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-white/20 flex flex-col gap-4 hover:-translate-y-1 transition-transform">
                            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                              <span className="text-xs text-slate-500 font-black truncate">{item.customer_email}</span>
                              <div className="flex text-xl drop-shadow-sm">
                                <span className="text-yellow-400">{'★'.repeat(parseInt(item.rating))}</span>
                                <span className="text-slate-200">{'★'.repeat(5 - parseInt(item.rating))}</span>
                              </div>
                            </div>
                            <p className="text-slate-800 text-sm font-semibold leading-relaxed">"{item.comments}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* about page */}
        {currentPage === 'about' && (
          <div className="max-w-4xl mx-auto bg-white p-10 rounded-2xl shadow-sm border border-slate-200 mt-[-20px] relative z-10 animate-fade-in-up mb-20">
            
            {/* Header Section */}
            <div className="border-b border-slate-100 pb-8 mb-8 text-center md:text-left">
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">System Architecture</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                TriageAI is an intelligent routing platform designed to eliminate chronological routing bottlenecks in modern customer support. Instead of treating all tickets equally in a static, first-in-first-out (FIFO) queue, our engine analyzes and prioritizes incoming requests in real-time.
              </p>
            </div>
            
            {/* Grid Conceptual Layout */}
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Card 1: Prioritization */}
              <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-xl shadow-inner">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Intelligent Prioritization</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Powered by natural language processing, the system assigns a dynamic 1-100 priority score to every inbound ticket. This guarantees that human agents consistently pull the most critical issues first, actively reducing response times for high-impact problems and preventing customer churn.
                </p>
              </div>

              {/* Card 2: human review */}
              <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 hover:border-purple-300 transition-colors shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-purple-100 text-purple-600 p-3 rounded-xl shadow-inner">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Human-in-the-Loop Validation</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  To ensure absolute quality control, the system employs strict confidence thresholds. If a ticket's analysis falls below an acceptable certainty such as with spam, gibberish, or highly complex edge-cases, it is safely quarantined. A manager then reviews these flagged items, preventing noise from disrupting the main agent queue.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* 3. feedback page */}
        {currentPage === 'feedback' && (
          <div className="relative min-h-screen w-full flex flex-col items-center pt-24 px-4 bg-slate-900 pb-32">
            
            {/* 1. FEEDBACK VIDEO BACKGROUND */}
            <video autoPlay loop muted playsInline className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-40 pointer-events-none">
              <source src="/network-bg.mp4" type="video/mp4" />
            </video>
            
            {/* Dark Overlay for Readability */}
            <div className="fixed inset-0 bg-slate-900/70 z-0"></div>

            {/* Glowing Glassmorphism Form Container */}
            <div className="relative z-10 max-w-xl w-full bg-white/95 backdrop-blur-xl p-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 animate-fade-in-up overflow-hidden">
              
              {/* Premium Brand Accent Line */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

              <h2 className="text-2xl font-black mb-2 text-slate-800 tracking-tight">Platform Feedback</h2>
              <p className="text-slate-500 mb-8 text-sm font-medium">Help our engineering team improve the user experience.</p>
              
              <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-6">
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={feedbackData.customer_email}
                    onChange={(e) => setFeedbackData({...feedbackData, customer_email: e.target.value})}
                    className="w-full bg-slate-50/80 border border-slate-200 text-slate-900 p-3.5 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 placeholder-slate-400 font-medium shadow-inner"
                    placeholder="example: name@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">System Rating</label>
                  <div className="flex gap-2 bg-slate-50/50 p-3 rounded-lg border border-slate-100 shadow-inner w-fit">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <label key={star} className="cursor-pointer transition-transform hover:scale-110">
                        <input type="radio" name="rating" value={star} checked={feedbackData.rating === String(star)} onChange={(e) => setFeedbackData({...feedbackData, rating: e.target.value})} className="hidden" />
                        <span className={`text-3xl transition-colors drop-shadow-sm ${feedbackData.rating >= star ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Technical Comments</label>
                  <textarea 
                    rows="5" 
                    placeholder="Report bugs or suggest feature improvements..." 
                    required 
                    value={feedbackData.comments} 
                    onChange={(e) => setFeedbackData({...feedbackData, comments: e.target.value})} 
                    className="w-full bg-slate-50/80 border border-slate-200 text-slate-900 p-3.5 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 resize-none font-medium shadow-inner" 
                  />
                </div>

                <button type="submit" className="mt-2 w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition-colors duration-300 shadow-lg">
                  Submit Feedback
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App
