import { useState, useEffect } from 'react'

function App() {
  // --- NAVIGATION & AUTH STATE ---
  const [currentPage, setCurrentPage] = useState('dashboard') // 'dashboard', 'about', 'feedback'
  const [role, setRole] = useState('customer') // 'customer', 'agent', 'manager'

  // --- DATA STATES ---
  const [currentTicket, setCurrentTicket] = useState(null)
  const [reviewTickets, setReviewTickets] = useState([])
  const [formData, setFormData] = useState({ customer_email: '', description: '', category: 'General' })
  
  // --- FEEDBACK STATE ---
  const [feedbackData, setFeedbackData] = useState({ rating: '5', comments: '' })

  // ==========================================
  // BACKEND LOGIC
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault() 
    try {
      await fetch('http://127.0.0.1:8000/tickets/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      alert("Ticket Successfully Submitted!")
      setFormData({ ...formData, description: '', customer_email: '' }) 
    } catch (error) {
      console.error("Error submitting ticket:", error)
    }
  }

  const fetchNextTicket = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/tickets/next/')
      const data = await response.json()
      if (data.message === "Queue is empty!") {
        alert("Inbox Zero! No open tickets right now.")
        setCurrentTicket(null)
      } else {
        setCurrentTicket(data)
      }
    } catch (error) {
      console.error("Error fetching ticket:", error)
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

  const fetchReviewTickets = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/tickets/review/')
      const data = await response.json()
      setReviewTickets(data)
    } catch (error) {
      console.error("Error fetching review tickets:", error)
    }
  }

  useEffect(() => {
    if (role === 'manager' && currentPage === 'dashboard') {
      fetchReviewTickets()
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

  const handleFeedbackSubmit = (e) => {
    e.preventDefault()
    alert(`Thank you for rating us ${feedbackData.rating} stars! Your feedback helps us improve.`)
    setFeedbackData({ rating: '5', comments: '' })
  }

  // ==========================================
  // UI RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      
      {/* --- PROFESSIONAL NAVBAR --- */}
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
              <option value="manager">Review Manager</option>
            </select>
          </div>
        )}
      </nav>

      {/* --- CONDITIONAL MARKETING HERO (Only on 'About' page now) --- */}
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

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-grow">
        
        {/* 1. DASHBOARD PAGE */}
        {currentPage === 'dashboard' && (
          <div className="animate-fade-in-up">
            
            {/* CUSTOMER VIEW (Scrollable Welcome + Form) */}
            {role === 'customer' && (
              <div className="flex flex-col items-center w-full">
                
                {/* Full-Height Welcome Section */}
                <div className="w-full flex flex-col items-center justify-center min-h-[70vh] bg-white border-b border-slate-200 text-center px-4">
                  <h1 className="text-5xl font-light text-slate-900 mb-6 tracking-tight">
                    Welcome to <span className="font-semibold">TriageAI</span>
                  </h1>
                  <p className="text-lg text-slate-500 max-w-2xl leading-relaxed mb-16">
                    Our intelligent routing engine analyzes your request in real-time to ensure it reaches the correct department immediately. Let us know how we can assist you today.
                  </p>
                  <div className="text-slate-400 flex flex-col items-center animate-bounce">
                    <span className="text-sm font-semibold uppercase tracking-widest mb-2">Scroll to Submit</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  </div>
                </div>

                {/* Form Section (Below the fold) */}
                <div className="max-w-xl w-full bg-white p-10 rounded-xl shadow-sm border border-slate-200 mt-24 mb-32">
                  <h2 className="text-2xl font-semibold mb-8 text-slate-800 border-b border-slate-100 pb-4">Create a Support Ticket</h2>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Email Address</label>
                      <input type="email" required value={formData.customer_email} onChange={(e) => setFormData({...formData, customer_email: e.target.value})} className="w-full border border-slate-300 p-3 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Issue Category</label>
                      <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full border border-slate-300 p-3 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition bg-white">
                        <option>General Inquiry</option>
                        <option>Technical Support</option>
                        <option>Billing & Sponsorship</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Description</label>
                      <textarea rows="5" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border border-slate-300 p-3 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none" />
                    </div>
                    <button type="submit" className="mt-2 bg-slate-900 text-white font-semibold py-3.5 rounded-md hover:bg-slate-800 transition shadow-sm">
                      Submit Ticket
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* AGENT VIEW */}
            {role === 'agent' && (
               <div className="max-w-3xl mx-auto flex flex-col items-center mt-16 px-4">
               {!currentTicket ? (
                 <button onClick={fetchNextTicket} className="bg-blue-600 text-white text-lg font-semibold py-4 px-8 rounded shadow-sm hover:bg-blue-700 transition">
                   Pull Next Urgent Ticket
                 </button>
               ) : (
                 <div className="w-full bg-white p-8 rounded-lg border-l-4 border-blue-600 shadow-sm border-y border-r border-slate-200">
                   <div className="flex justify-between items-start mb-8">
                     <div>
                       <span className="font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded text-sm">{currentTicket.category}</span>
                       <h3 className="text-slate-500 text-sm mt-4">Customer: <span className="font-medium text-slate-900">{currentTicket.customer_email}</span></h3>
                     </div>
                     <div className="text-right bg-slate-50 p-3 rounded border border-slate-100">
                       <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">AI Priority</span>
                       <span className="text-3xl font-bold text-slate-800">{currentTicket.ai_priority} <span className="text-sm font-normal text-slate-400">/ 100</span></span>
                     </div>
                   </div>
                   
                   <div className="bg-slate-50 p-5 rounded border border-slate-100 mb-8">
                     <p className="text-slate-800 text-base leading-relaxed whitespace-pre-wrap">{currentTicket.description}</p>
                   </div>
                   
                   <button onClick={handleResolve} className="w-full bg-slate-900 text-white font-semibold py-3 rounded hover:bg-slate-800 transition">
                     Mark as Resolved & Close
                   </button>
                 </div>
               )}
             </div>
            )}

            {/* MANAGER VIEW */}
            {role === 'manager' && (
              <div className="max-w-6xl mx-auto mt-10 px-4">
                <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">Human Review Sandbox</h2>
                    <p className="text-sm text-slate-500 mt-1">Tickets flagged by AI due to low confidence scores.</p>
                  </div>
                  <button onClick={fetchReviewTickets} className="text-sm text-blue-600 hover:text-blue-800 font-medium transition">Refresh Queue</button>
                </div>

                {reviewTickets.length === 0 ? (
                  <div className="bg-white py-20 px-4 text-center rounded shadow-sm border border-slate-200">
                    <h3 className="text-lg font-medium text-slate-700">Sandbox is Empty</h3>
                    <p className="text-slate-500 mt-1 text-sm">No manual reviews are currently required.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {reviewTickets.map(ticket => (
                      <div key={ticket.id} className="bg-white p-5 rounded shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex flex-col gap-2 min-w-[120px] text-center">
                          <div className="bg-slate-50 text-slate-700 py-2 rounded border border-slate-200">
                            <span className="block text-[10px] uppercase font-semibold text-slate-500">Priority</span>
                            <span className="text-lg font-bold">{ticket.ai_priority}</span>
                          </div>
                          <div className="bg-slate-50 text-slate-700 py-2 rounded border border-slate-200">
                            <span className="block text-[10px] uppercase font-semibold text-slate-500">Confidence</span>
                            <span className="text-lg font-bold">{ticket.confidence}%</span>
                          </div>
                        </div>
                        <div className="flex-grow w-full">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">{ticket.category}</span>
                            <span className="text-xs text-slate-400">ID: {ticket.id}</span>
                          </div>
                          <p className="text-slate-800 text-sm font-medium border-l-2 border-slate-300 pl-3 py-1 mb-2">"{ticket.description}"</p>
                          <span className="text-xs text-slate-500">From: {ticket.customer_email}</span>
                        </div>
                        <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                          <button onClick={() => handleApprove(ticket.id)} className="flex-1 md:flex-none bg-white border border-slate-300 text-slate-700 font-medium py-2 px-4 rounded hover:bg-slate-50 transition text-sm">
                            Approve & Route
                          </button>
                          <button onClick={() => handleSpam(ticket.id)} className="flex-1 md:flex-none bg-white border border-red-200 text-red-600 font-medium py-2 px-4 rounded hover:bg-red-50 transition text-sm">
                            Mark as Spam
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. ABOUT PAGE (Remains unchanged below the new hero) */}
        {currentPage === 'about' && (
          <div className="max-w-4xl mx-auto bg-white p-10 rounded shadow-sm border border-slate-200 mt-[-20px] relative z-10 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">System Architecture</h2>
            <p className="text-base text-slate-600 leading-relaxed mb-8">
              TriageAI is an intelligent routing system designed to solve the "Deli Counter Problem" in modern customer support. Instead of treating all tickets equally in a standard queue, our engine analyzes and prioritizes incoming requests in real-time.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-slate-50 p-6 rounded border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Automated Prioritization</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Powered by LLMs, TriageAI assigns a 1-100 priority score to every ticket, ensuring human agents always resolve the most critical issues first to prevent VIP customer churn.</p>
              </div>
              <div className="bg-slate-50 p-6 rounded border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Human-in-the-Loop Validation</h3>
                <p className="text-slate-600 text-sm leading-relaxed">To ensure quality, any ticket that returns an AI confidence score below 70% is safely quarantined. A human manager reviews these edge-cases, preventing spam from impacting agent metrics.</p>
              </div>
            </div>
          </div>
        )}

        {/* 3. FEEDBACK PAGE */}
        {currentPage === 'feedback' && (
          <div className="max-w-xl mx-auto bg-white p-10 mt-16 rounded shadow-sm border border-slate-200 animate-fade-in-up">
            <h2 className="text-xl font-bold mb-2 text-slate-800">Platform Feedback</h2>
            <p className="text-slate-500 mb-8 text-sm">Help our engineering team improve the routing algorithms and user experience.</p>
            
            <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">System Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <label key={star} className="cursor-pointer">
                      <input type="radio" name="rating" value={star} checked={feedbackData.rating === String(star)} onChange={(e) => setFeedbackData({...feedbackData, rating: e.target.value})} className="hidden" />
                      <span className={`text-2xl transition ${feedbackData.rating >= star ? 'text-blue-500' : 'text-slate-200'}`}>★</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Technical Comments</label>
                <textarea rows="5" placeholder="Report bugs or suggest feature improvements..." required value={feedbackData.comments} onChange={(e) => setFeedbackData({...feedbackData, comments: e.target.value})} className="w-full border border-slate-300 p-3 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none text-sm" />
              </div>

              <button type="submit" className="bg-slate-900 text-white font-semibold py-3 rounded hover:bg-slate-800 transition text-sm">Submit Feedback</button>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}

export default App