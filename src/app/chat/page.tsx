'use client';
import { useState } from 'react';
import { HiPaperAirplane, HiVideoCamera, HiMicrophone } from 'react-icons/hi';
import { useActiveAvatars } from '@/contexts/ActiveAvatarsContext';
import { useAvatar } from '@/hooks/useAvatars';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState([
    { id: 1, user: 'Alice', text: 'Hey everyone!', timestamp: '2:30 PM' },
    { id: 2, user: 'Bob', text: 'Hello! How is everyone doing?', timestamp: '2:32 PM' },
    { id: 3, user: 'Charlie', text: 'Great to see you all here', timestamp: '2:35 PM' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const {
    activeAvatarIds,
    toggleActiveAvatar,
    removeActiveAvatar,
    isAvatarActive
  } = useActiveAvatars();
  //fetxh the avatar data for each active avatar you need to loop through activeAvatarIds and fetch the avatar data then 
  //set it in the state


  // Function to handle sending a message
  const sendMessage = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        user: 'You',
        text: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto h-[calc(100vh-2rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto">
          {/* Video Section */}
          <div className="flex flex-col">
            <div className="aspect-square bg-gray-800 dark:bg-gray-700 rounded-lg relative overflow-hidden shadow-lg">
              {/* Video placeholder */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
                <HiVideoCamera className="text-white text-8xl opacity-50" />
              </div>

              {/* Video overlay text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <h2 className="text-2xl font-bold mb-2">Video Call</h2>
                  <p className="text-lg opacity-80">Click to start video</p>
                </div>
              </div>

              {/* Video controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3 rounded-full transition-colors ${isMuted
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                      }`}
                  >
                    {isMuted ?
                      <HiMicrophone className="text-white text-xl" /> :
                      <HiMicrophone className="text-white text-xl" />
                    }
                  </button>
                  <button className="p-3 bg-gray-600 hover:bg-gray-700 rounded-full transition-colors">
                    <HiVideoCamera className="text-white text-xl" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chat</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">3 participants online</p>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex flex-col">
                  <div className={`max-w-xs lg:max-w-sm p-3 rounded-lg ${message.user === 'You'
                    ? 'bg-blue-600 text-white self-end'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white self-start'
                    }`}>
                    {message.user !== 'You' && (
                      <p className="text-xs font-semibold mb-1 text-gray-600 dark:text-gray-300">
                        {message.user}
                      </p>
                    )}
                    <p className="text-sm">{message.text}</p>
                  </div>
                  <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${message.user === 'You' ? 'self-end' : 'self-start'
                    }`}>
                    {message.timestamp}
                  </p>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage(e)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                           placeholder-gray-500 dark:placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                           disabled:cursor-not-allowed text-white rounded-lg transition-colors
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                           dark:focus:ring-offset-gray-800"
                >
                  <HiPaperAirplane className="text-lg" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;