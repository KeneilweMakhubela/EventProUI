import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

const Notifications = () => {
  const { apiCall } = useAuth();
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  
  // Form states
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('all');
  const [selectedDelivery, setSelectedDelivery] = useState('immediate');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');

  // Fetch players for dropdown
  const fetchPlayers = useCallback(async () => {
    try {
      const response = await apiCall('/api/Players?page=1&pageSize=100', 'GET');
      if (response && response.items) {
        setPlayers(response.items);
      }
    } catch (error) {
      console.error('❌ Error fetching players:', error);
    }
  }, [apiCall]);

  // Fetch events for dropdown
  const fetchEvents = useCallback(async () => {
    try {
      const response = await apiCall('/api/Events?page=1&pageSize=100', 'GET');
      if (response && response.items) {
        setEvents(response.items);
      }
    } catch (error) {
      console.error('❌ Error fetching events:', error);
    }
  }, [apiCall]);

  // Fetch notification logs
  const fetchNotificationLogs = useCallback(async () => {
    try {
      const response = await apiCall('/api/Notifications/logs?page=1&pageSize=20', 'GET');
      if (response && response.items) {
        setNotificationLogs(response.items);
      }
    } catch (error) {
      console.error('❌ Error fetching notification logs:', error);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchPlayers();
    fetchEvents();
    fetchNotificationLogs();
  }, [fetchPlayers, fetchEvents, fetchNotificationLogs]);

  // Send notification to all channels
  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setValidationErrors({
        subject: !subject.trim() ? 'Subject is required' : '',
        message: !message.trim() ? 'Message is required' : '',
      });
      return;
    }

    // Reset states
    setSendError('');
    setSendSuccess('');
    setValidationErrors({});
    setIsSending(true);

    const basePayload = {
      subject: subject.trim(),
      message: message.trim(),
    };

    try {
      let responses = [];
      let totalRecipients = 0;
      let channelResults = [];

      if (selectedRecipient === 'individual') {
        // Send to individual player via all channels
        if (!selectedPlayer) {
          setSendError('Please select a player');
          setIsSending(false);
          return;
        }

        const player = players.find(p => p.id === parseInt(selectedPlayer));
        if (!player) {
          setSendError('Player not found');
          setIsSending(false);
          return;
        }

        // Send Email
        try {
          const emailResponse = await apiCall('/api/Notifications/email', 'POST', {
            ...basePayload,
            to: player.email || '',
          });
          responses.push(emailResponse);
          channelResults.push('✅ Email');
          totalRecipients++;
        } catch (error) {
          console.error('Email failed:', error);
          channelResults.push('❌ Email');
        }

        // Send SMS
        try {
          const smsResponse = await apiCall('/api/Notifications/sms', 'POST', {
            ...basePayload,
            to: player.phoneNumber || '',
          });
          responses.push(smsResponse);
          channelResults.push('✅ SMS');
          totalRecipients++;
        } catch (error) {
          console.error('SMS failed:', error);
          channelResults.push('❌ SMS');
        }

        // Send WhatsApp
        try {
          const whatsappResponse = await apiCall('/api/Notifications/whatsapp', 'POST', {
            ...basePayload,
            to: player.phoneNumber || '',
          });
          responses.push(whatsappResponse);
          channelResults.push('✅ WhatsApp');
          totalRecipients++;
        } catch (error) {
          console.error('WhatsApp failed:', error);
          channelResults.push('❌ WhatsApp');
        }

        const successCount = channelResults.filter(r => r.includes('✅')).length;
        setSendSuccess(`✅ Notification sent to ${player.fullName || player.name} via ${successCount}/3 channels: ${channelResults.join(', ')}`);

      } else if (selectedRecipient === 'event') {
        // Send to all players in an event via all channels
        if (!selectedEvent) {
          setSendError('Please select an event');
          setIsSending(false);
          return;
        }

        const event = events.find(e => e.id === parseInt(selectedEvent));
        // Get players for this event (you may need to adjust this based on your data structure)
        const eventPlayers = players.filter(p => p.eventId === parseInt(selectedEvent)) || [];

        if (eventPlayers.length === 0) {
          setSendError('No players found for this event');
          setIsSending(false);
          return;
        }

        // Get email recipients
        const emailRecipients = eventPlayers.map(p => p.email).filter(Boolean);
        // Get phone recipients
        const phoneRecipients = eventPlayers.map(p => p.phoneNumber).filter(Boolean);

        // Send Bulk Email
        try {
          const emailResponse = await apiCall('/api/Notifications/bulk', 'POST', {
            ...basePayload,
            notificationType: 'Email',
            recipients: emailRecipients,
          });
          responses.push(emailResponse);
          channelResults.push(`✅ Email (${emailRecipients.length})`);
          totalRecipients += emailRecipients.length;
        } catch (error) {
          console.error('Bulk Email failed:', error);
          channelResults.push('❌ Email');
        }

        // Send Bulk SMS
        try {
          const smsResponse = await apiCall('/api/Notifications/bulk', 'POST', {
            ...basePayload,
            notificationType: 'SMS',
            recipients: phoneRecipients,
          });
          responses.push(smsResponse);
          channelResults.push(`✅ SMS (${phoneRecipients.length})`);
          totalRecipients += phoneRecipients.length;
        } catch (error) {
          console.error('Bulk SMS failed:', error);
          channelResults.push('❌ SMS');
        }

        // Send Bulk WhatsApp
        try {
          const whatsappResponse = await apiCall('/api/Notifications/bulk', 'POST', {
            ...basePayload,
            notificationType: 'WhatsApp',
            recipients: phoneRecipients,
          });
          responses.push(whatsappResponse);
          channelResults.push(`✅ WhatsApp (${phoneRecipients.length})`);
          totalRecipients += phoneRecipients.length;
        } catch (error) {
          console.error('Bulk WhatsApp failed:', error);
          channelResults.push('❌ WhatsApp');
        }

        const successCount = channelResults.filter(r => r.includes('✅')).length;
        setSendSuccess(`✅ Notification sent to ${totalRecipients} players in "${event?.name || 'event'}" via ${successCount}/3 channels: ${channelResults.join(', ')}`);

      } else {
        // Send to all players via all channels
        const allPlayers = players || [];
        
        if (allPlayers.length === 0) {
          setSendError('No players available to send notifications');
          setIsSending(false);
          return;
        }

        const emailRecipients = allPlayers.map(p => p.email).filter(Boolean);
        const phoneRecipients = allPlayers.map(p => p.phoneNumber).filter(Boolean);

        // Send Bulk Email
        try {
          const emailResponse = await apiCall('/api/Notifications/bulk', 'POST', {
            ...basePayload,
            notificationType: 'Email',
            recipients: emailRecipients,
          });
          responses.push(emailResponse);
          channelResults.push(`✅ Email (${emailRecipients.length})`);
          totalRecipients += emailRecipients.length;
        } catch (error) {
          console.error('Bulk Email failed:', error);
          channelResults.push('❌ Email');
        }

        // Send Bulk SMS
        try {
          const smsResponse = await apiCall('/api/Notifications/bulk', 'POST', {
            ...basePayload,
            notificationType: 'SMS',
            recipients: phoneRecipients,
          });
          responses.push(smsResponse);
          channelResults.push(`✅ SMS (${phoneRecipients.length})`);
          totalRecipients += phoneRecipients.length;
        } catch (error) {
          console.error('Bulk SMS failed:', error);
          channelResults.push('❌ SMS');
        }

        // Send Bulk WhatsApp
        try {
          const whatsappResponse = await apiCall('/api/Notifications/bulk', 'POST', {
            ...basePayload,
            notificationType: 'WhatsApp',
            recipients: phoneRecipients,
          });
          responses.push(whatsappResponse);
          channelResults.push(`✅ WhatsApp (${phoneRecipients.length})`);
          totalRecipients += phoneRecipients.length;
        } catch (error) {
          console.error('Bulk WhatsApp failed:', error);
          channelResults.push('❌ WhatsApp');
        }

        const successCount = channelResults.filter(r => r.includes('✅')).length;
        setSendSuccess(`✅ Notification sent to ${totalRecipients} total players via ${successCount}/3 channels: ${channelResults.join(', ')}`);
      }

      // Clear form on success
      setSubject('');
      setMessage('');
      setScheduleDate('');
      setValidationErrors({});
      
      // Refresh notification logs
      await fetchNotificationLogs();

      setTimeout(() => {
        setSendSuccess('');
      }, 8000);

    } catch (error) {
      console.error('❌ Error sending notification:', error);
      
      if (error.details) {
        setValidationErrors(error.details);
        setSendError('Please fix the highlighted fields.');
      } else {
        setSendError(error.message || 'Failed to send notification. Please try again.');
      }
    } finally {
      setIsSending(false);
    }
  };

  // Helper to get error message for a field
  const getFieldError = (fieldName) => {
    const errors = validationErrors[fieldName];
    if (Array.isArray(errors)) {
      return errors.join(', ');
    }
    return errors || '';
  };

  // Clear form
  const handleClear = () => {
    setSubject('');
    setMessage('');
    setScheduleDate('');
    setSelectedPlayer('');
    setSelectedEvent('');
    setValidationErrors({});
    setSendError('');
    setSendSuccess('');
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 text-2xl font-bold text-[#132149] mb-6">
        <i className="fas fa-bell text-[#02a2e0]"></i> Send Notification
      </div>

      {/* Success/Error Messages */}
      {sendSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
          <i className="fas fa-check-circle text-green-500"></i>
          <span className="text-green-700">{sendSuccess}</span>
          <button onClick={() => setSendSuccess('')} className="ml-auto text-green-500 hover:text-green-700">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {sendError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-red-500"></i>
          <span className="text-red-700">{sendError}</span>
          <button onClick={() => setSendError('')} className="ml-auto text-red-500 hover:text-red-700">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className="card-gradient rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold text-[#132149] mb-4">📝 Compose Message</h3>
        
        {/* Channel Info */}
        <div className="mb-4 p-3 bg-blue-50 rounded-2xl border border-blue-200">
          <p className="text-sm text-blue-700 flex items-center gap-2">
            <i className="fas fa-info-circle"></i>
            Notifications will be sent via <strong>Email, SMS, and WhatsApp</strong> simultaneously.
          </p>
        </div>
        
        {/* Subject */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-600 mb-1 block">
            Subject <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            value={subject} 
            onChange={(e) => {
              setSubject(e.target.value);
              setValidationErrors(prev => ({ ...prev, subject: '' }));
            }} 
            placeholder="Enter message subject..." 
            className={`w-full p-3 rounded-2xl border-2 ${
              getFieldError('subject') 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-200 bg-gray-50'
            } focus:border-[#02a2e0] focus:bg-white outline-none transition-all`}
          />
          {getFieldError('subject') && (
            <p className="mt-1 text-xs text-red-500">{getFieldError('subject')}</p>
          )}
        </div>
        
        {/* Message */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-600 mb-1 block">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea 
            value={message} 
            onChange={(e) => {
              setMessage(e.target.value);
              setValidationErrors(prev => ({ ...prev, message: '' }));
            }} 
            placeholder="Compose your message..." 
            rows="5" 
            className={`w-full p-4 rounded-2xl border-2 ${
              getFieldError('message') 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-200 bg-gray-50'
            } focus:border-[#02a2e0] focus:bg-white outline-none transition-all resize-none`}
          />
          {getFieldError('message') && (
            <p className="mt-1 text-xs text-red-500">{getFieldError('message')}</p>
          )}
        </div>
        
        {/* Send To */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-600 mb-2 block">Send To</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { value: 'all', icon: 'fa-globe', label: 'All Players' },
              { value: 'individual', icon: 'fa-user', label: 'Individual Player' },
              { value: 'event', icon: 'fa-calendar-check', label: 'Event Players' }
            ].map(btn => (
              <button 
                key={btn.value} 
                onClick={() => setSelectedRecipient(btn.value)} 
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  selectedRecipient === btn.value 
                    ? 'border-[#02a2e0] bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <i className={`fas ${btn.icon} text-[#02a2e0]`}></i>
                <span className="font-medium text-sm">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Individual Player Selection */}
        {selectedRecipient === 'individual' && (
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Select Player</label>
            <select 
              value={selectedPlayer} 
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all"
            >
              <option value="">Choose a player...</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  {p.fullName || p.name} ({p.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Event Selection */}
        {selectedRecipient === 'event' && (
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Select Event</label>
            <select 
              value={selectedEvent} 
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all"
            >
              <option value="">Choose an event...</option>
              {events.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.currentRegistrations || e.registered || 0} players)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Delivery Options */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-600 mb-2 block">Delivery Options</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'immediate', icon: 'fa-paper-plane', label: 'Send Immediately' },
              { value: 'schedule', icon: 'fa-clock', label: 'Schedule Later' },
              { value: 'draft', icon: 'fa-save', label: 'Save as Draft' },
              { value: 'preview', icon: 'fa-eye', label: 'Preview Message' }
            ].map(btn => (
              <button 
                key={btn.value} 
                onClick={() => setSelectedDelivery(btn.value)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedDelivery === btn.value 
                    ? 'bg-[#02a2e0] text-white' 
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <i className={`fas ${btn.icon}`}></i> {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Date Picker */}
        {selectedDelivery === 'schedule' && (
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Schedule Date & Time</label>
            <input 
              type="datetime-local" 
              value={scheduleDate} 
              onChange={(e) => setScheduleDate(e.target.value)} 
              className="w-full p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white outline-none transition-all"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button 
            onClick={handleSend} 
            disabled={isSending}
            className="btn-primary-gradient text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending to All Channels...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i> Send to All Channels
              </>
            )}
          </button>
          <button 
            onClick={handleClear} 
            className="border border-gray-300 text-gray-600 px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-gray-50 transition-all"
          >
            <i className="fas fa-eraser"></i> Clear Form
          </button>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="card-gradient rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-[#132149] mb-4">📨 Recent Notifications</h3>
        
        {notificationLogs.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-inbox text-gray-300 text-3xl mb-3"></i>
            <p className="text-gray-500">No notifications sent yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notificationLogs.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{item.subject || item.title || 'No subject'}</p>
                    {item.notificationType && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 flex-shrink-0">
                        {item.notificationType}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {item.recipientEmail || item.recipientPhone || item.info || 'No recipient'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(item.sentAt || item.createdAt || item.timestamp)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${getStatusBadge(item.status)}`}>
                  {item.status || 'Sent'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Notifications;